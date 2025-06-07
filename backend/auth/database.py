import os
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from typing import Optional, Dict, Any
from datetime import datetime
import uuid
from .encryption import encryption_service, password_service
from .models import UserCreate, UserResponse
from dotenv import load_dotenv

class DynamoDBService:
    def __init__(self):
        load_dotenv()
        # !!! HIGHLIGHT: ENV-SPECIFIC CONFIG !!!
        self.region = os.getenv("AWS_REGION", "us-west-2")
        self.table_name = os.getenv("DYNAMODB_USERS_TABLE", "ecs-heartbeat-users")
        
        session = boto3.Session()
        
        # !!! HIGHLIGHT: CREDENTIALS HANDLING - SHOULD NOT BE HARDCODED !!!
        self.dynamodb = session.client('dynamodb', region_name=self.region)
        self.dynamodb_resource = session.resource('dynamodb', region_name=self.region)
        self.table = self.dynamodb_resource.Table(self.table_name)
    
    async def create_user(self, user_data: UserCreate) -> UserResponse:
        try:
            user_id = str(uuid.uuid4())
            hashed_password = password_service.hash_password(user_data.password)
            encrypted_email = encryption_service.encrypt(user_data.email)
            
            user_item = {
                'id': user_id,
                'username': user_data.username,
                'encrypted_email': encrypted_email,
                'encrypted_password': hashed_password,
                'role': user_data.role,
                'created_at': datetime.utcnow().isoformat(),
                'is_active': True
            }
            
            response = self.table.put_item(
                Item=user_item,
                ConditionExpression='attribute_not_exists(username)'
            )
            
            return UserResponse(
                id=user_id,
                username=user_data.username,
                email=user_data.email,
                role=user_data.role
            )
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                raise ValueError("Username already exists")
            raise Exception(f"Failed to create user: {str(e)}")
    
    async def authenticate_user(self, username: str, password: str) -> Optional[UserResponse]:
        try:
            response = self.table.get_item(Key={'username': username})
            
            if 'Item' not in response:
                return None
            
            user_item = response['Item']
            
            if not user_item.get('is_active', True):
                raise ValueError("Account is deactivated")
            
            if not password_service.verify_password(password, user_item['encrypted_password']):
                return None
            
            decrypted_email = encryption_service.decrypt(user_item['encrypted_email'])
            last_login = datetime.utcnow().isoformat()
            self.table.update_item(
                Key={'username': username},
                UpdateExpression='SET last_login = :last_login',
                ExpressionAttributeValues={':last_login': last_login}
            )
            
            return UserResponse(
                id=user_item['id'],
                username=user_item['username'],
                email=decrypted_email,
                role=user_item['role'],
                last_login=last_login
            )
            
        except Exception as e:
            return None
    
    async def get_user_by_username(self, username: str) -> Optional[UserResponse]:
        try:
            response = self.table.get_item(Key={'username': username})
            
            if 'Item' not in response:
                return None
            
            user_item = response['Item']
            decrypted_email = encryption_service.decrypt(user_item['encrypted_email'])
            
            return UserResponse(
                id=user_item['id'],
                username=user_item['username'],
                email=decrypted_email,
                role=user_item['role'],
                last_login=user_item.get('last_login')
            )
            
        except Exception as e:
            return None

db_service = DynamoDBService()