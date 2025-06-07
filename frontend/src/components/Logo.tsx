import HeartBeatLogo from "./HeartBeatLogo"

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl' 

interface LogoProps {
  size?: LogoSize
  showText?: boolean
  className?: string
}

export default function Logo({ 
  size = "md", 
  showText = true, 
  className = "" 
}: LogoProps) {
  return (
    <HeartBeatLogo 
      size={size} 
      showText={showText} 
      className={className}
    />
  )
}