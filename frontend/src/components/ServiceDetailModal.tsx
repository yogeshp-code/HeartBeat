"use client";

import { useEffect, useState } from "react";
import {
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Activity,
  Server,
} from "lucide-react";
import type { ClusterService, ServiceDetails } from "../types";
import { fetchServiceDetails } from "../api";
import CodeBlock from "./CodeBlock";
import MetricsChart from "./MetricsChart";

interface ServiceDetailModalProps {
  service: ClusterService | null;
  onClose: () => void;
}

export default function ServiceDetailModal({
  service,
  onClose,
}: ServiceDetailModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [details, setDetails] = useState<ServiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (service) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow || "unset";
      };
    }
  }, [service]);

  useEffect(() => {
    if (!service) {
      setDetails(null);
      return;
    }

    const loadServiceDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchServiceDetails(
          service.service_name,
          service.cluster_name,
          service.account_alias
        );
        setDetails(data);
      } catch (err) {
        console.error("Error fetching service details:", err);
        setError("Failed to load service details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadServiceDetails();
  }, [service]);

  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                service.running_tasks > 0 ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {service.service_name}
            </h2>
            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              {service.cluster_name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          {[
            { id: "overview", icon: Server, label: "Overview" },
            { id: "tasks", icon: CheckCircle, label: "Tasks" },
            { id: "config", icon: Settings, label: "Config" },
            { id: "events", icon: Activity, label: "Events" },
            { id: "deployment", icon: Clock, label: "Deployment" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="flex items-center space-x-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState
              error={error}
              onRetry={() => setActiveTab("overview")}
            />
          ) : details ? (
            <TabContent
              activeTab={activeTab}
              service={service}
              details={details}
            />
          ) : (
            <div className="text-center text-gray-500">
              No service details found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-500 dark:text-gray-400">
        Loading service details...
      </p>
    </div>
  );
}

// Error State Component
function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <p className="mt-4 text-red-500">{error}</p>
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  );
}

// Tab Content Router
function TabContent({
  activeTab,
  service,
  details,
}: {
  activeTab: string;
  service: ClusterService;
  details: ServiceDetails;
}) {
  switch (activeTab) {
    case "overview":
      return <ServiceOverview service={service} details={details} />;
    case "deployment":
      return <DeploymentInfo details={details} />;
    case "tasks":
      return <TaskDetails details={details} />;
    case "events":
      return <EventsAndLogs details={details} />;
    case "config":
      return <ConfigurationDetails details={details} />;
    default:
      return <ServiceOverview service={service} details={details} />;
  }
}

// Overview Tab Component
function ServiceOverview({
  service,
  details,
}: {
  service: ClusterService;
  details: ServiceDetails;
}) {
  const overview = details.service_overview;
  const isHealthy = service.running_tasks >= overview.desired_count;

  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <Section title="Service Overview">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <InfoItem label="Service Name" value={service.service_name} />
            <InfoItem label="Cluster" value={service.cluster_name} />
            <InfoItem
              label="Status"
              value={
                <div className="flex items-center">
                  <StatusIndicator active={service.running_tasks > 0} />
                  <span>
                    {service.running_tasks > 0 ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              }
            />
            <InfoItem
              label="Created At"
              value={formatToIST(overview.creation_date)}
            />
          </div>

          <div className="space-y-4">
            <InfoItem
              label="Running Tasks"
              value={`${service.running_tasks} / ${overview.desired_count}`}
              additional={
                <ProgressBar
                  value={(service.running_tasks / overview.desired_count) * 100}
                  max={100}
                />
              }
            />
            <InfoItem
              label="Service ARN"
              value={overview.service_arn}
              truncate
            />
            <InfoItem
              label="Task Definition"
              value={overview.task_definition}
            />
            <InfoItem label="Launch Type" value={overview.launch_type} />
          </div>
        </div>

        {/* Metrics Section */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Historical Data (Last 6 Hours)
          </h4>
          <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-md shadow-sm backdrop-blur-sm">
            <div className="grid grid-cols-1 gap-4">
              <MetricChart
                title="CPU Utilization"
                data={overview.historical_cpu}
                color="#3b82f6"
              />
              <MetricChart
                title="Memory Utilization"
                data={overview.historical_memory}
                color="#ef4444"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Health Metrics Section */}
      <Section title="Health Metrics">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="CPU Utilization"
            value={`${service.current_cpu.toFixed(1)}%`}
            progress={service.current_cpu}
          />
          <MetricCard
            label="Memory Utilization"
            value={`${service.current_memory.toFixed(1)}%`}
            progress={service.current_memory}
          />
          <HealthStatusCard
            isHealthy={isHealthy}
            runningTasks={service.running_tasks}
            desiredCount={overview.desired_count}
          />
        </div>
      </Section>
    </div>
  );
}

// Deployment Tab Component
function DeploymentInfo({ details }: { details: ServiceDetails }) {
  const currentDeployment = details.deployment_info.current_deployment;
  const deploymentHistory = details.deployment_info.deployment_history;

  return (
    <div className="space-y-6">
      {/* Current Deployment Section */}
      <Section title="Current Deployment">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <InfoItem label="Deployment ID" value={currentDeployment.id} />
            <StatusBadge status={currentDeployment.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <InfoItem
              label="Started"
              value={formatToIST(currentDeployment.created_at)}
            />
            <InfoItem
              label="Updated"
              value={formatToIST(currentDeployment.updated_at)}
            />
            <InfoItem
              label="Task Definition"
              value={currentDeployment.task_definition}
              truncate
            />
          </div>

          <ProgressIndicator
            label="Deployment Progress"
            progress={currentDeployment.rollout_progress}
            additionalText={`${currentDeployment.running_count} / ${currentDeployment.desired_count} tasks`}
          />
        </div>
      </Section>

      {/* Deployment History Section */}
      <Section title="Deployment History" subtitle="Last 5 deployments">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <TableHeader label="ID" />
                <TableHeader label="Status" />
                <TableHeader label="Task Definition" />
                <TableHeader label="Started" />
                <TableHeader label="Completed" />
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {deploymentHistory.map((deployment, index) => (
                <tr
                  key={index}
                  className={
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800/50"
                  }
                >
                  <TableCell value={deployment.id.substring(0, 8)} />
                  <TableCell>
                    <StatusBadge status={deployment.status} />
                  </TableCell>
                  <TableCell value={deployment.task_definition} truncate />
                  <TableCell value={formatToIST(deployment.created_at)} />
                  <TableCell
                    value={formatToIST(deployment.completed_at) || "-"}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

// Tasks Tab Component
function TaskDetails({ details }: { details: ServiceDetails }) {
  const { running_count, desired_count, tasks } = details.current_tasks;

  return (
    <div className="space-y-6">
      <Section title="Running Tasks">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <MetricCard label="Running Tasks" value={running_count} />
          <MetricCard label="Desired Tasks" value={desired_count} />
        </div>

        {tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <TaskCard key={index} task={task} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Server} message="No running tasks found" />
        )}
      </Section>
    </div>
  );
}

function EventsAndLogs({ details }: { details: ServiceDetails }) {
  const { service_events, scaling_events } = details.events;
  const [scalingCurrentPage, setScalingCurrentPage] = useState(1);
  const scalingRecordsPerPage = 5;

  const [eventsCurrentPage, setEventsCurrentPage] = useState(1);
  const eventsRecordsPerPage = 5; 

  const scalingTotalRecords = scaling_events.length;
  const scalingTotalPages = Math.ceil(
    scalingTotalRecords / scalingRecordsPerPage
  );
  const scalingIndexOfLastRecord = scalingCurrentPage * scalingRecordsPerPage;
  const scalingIndexOfFirstRecord =
    scalingIndexOfLastRecord - scalingRecordsPerPage;
  const scalingCurrentRecords = scaling_events.slice(
    scalingIndexOfFirstRecord,
    scalingIndexOfLastRecord
  );


  const eventsTotalRecords = service_events.length;
  const eventsTotalPages = Math.ceil(eventsTotalRecords / eventsRecordsPerPage);
  const eventsIndexOfLastRecord = eventsCurrentPage * eventsRecordsPerPage;
  const eventsIndexOfFirstRecord =
    eventsIndexOfLastRecord - eventsRecordsPerPage;
  const eventsCurrentRecords = service_events.slice(
    eventsIndexOfFirstRecord,
    eventsIndexOfLastRecord
  );


  const paginateScaling = (pageNumber) => setScalingCurrentPage(pageNumber);
  const paginateEvents = (pageNumber) => setEventsCurrentPage(pageNumber);

  const PaginationControls = ({
    currentPage,
    totalPages,
    totalRecords,
    indexOfFirstRecord,
    indexOfLastRecord,
    paginate,
  }) => {
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing <span className="font-medium">{indexOfFirstRecord + 1}</span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(indexOfLastRecord, totalRecords)}
          </span>{" "}
          of <span className="font-medium">{totalRecords}</span> results
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`px-3 py-1 rounded-md ${
                currentPage === number
                  ? "bg-blue-500 text-white"
                  : "border border-gray-300 dark:border-gray-600"
              }`}
            >
              {number}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-6">
      {/* Service Events Section */}
      <Section title="Recent Events">
        {service_events.length > 0 ? (
          <>
            <div className="space-y-4">
              {eventsCurrentRecords.map((event, index) => (
                <EventCard key={index} event={event} />
              ))}
            </div>
            {eventsTotalPages > 1 && (
              <PaginationControls
                currentPage={eventsCurrentPage}
                totalPages={eventsTotalPages}
                totalRecords={eventsTotalRecords}
                indexOfFirstRecord={eventsIndexOfFirstRecord}
                indexOfLastRecord={eventsIndexOfLastRecord}
                paginate={paginateEvents}
              />
            )}
          </>
        ) : (
          <EmptyState icon={Activity} message="No recent events found" />
        )}
      </Section>

      <Section title="Scaling Events">
        {scaling_events.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <TableHeader label="Starttime" />
                    <TableHeader label="Event" />
                    <TableHeader label="Status" />
                    <TableHeader label="Cause" />
                    <TableHeader label="Reason" />
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {scalingCurrentRecords.map((event, index) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800/50"
                      }
                    >
                      <TableCell value={formatToIST(event.start_time)} />
                      <TableCell value={event.description} />
                      <TableCell>
                        <StatusBadge
                          status={event.status_code}
                          type={
                            event.status_code === "Successful"
                              ? "success"
                              : "danger"
                          }
                        />
                      </TableCell>
                      <TableCell value={event.cause} />
                      <TableCell value={event.reason} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {scalingTotalPages > 1 && (
              <PaginationControls
                currentPage={scalingCurrentPage}
                totalPages={scalingTotalPages}
                totalRecords={scalingTotalRecords}
                indexOfFirstRecord={scalingIndexOfFirstRecord}
                indexOfLastRecord={scalingIndexOfLastRecord}
                paginate={paginateScaling}
              />
            )}
          </>
        ) : (
          <EmptyState icon={Activity} message="No scaling events found" />
        )}
      </Section>
    </div>
  );
}


function ConfigurationDetails({ details }: { details: ServiceDetails }) {
  return (
    <div className="space-y-6">
      {/* Service Configuration Section */}
      <Section title="Service Configuration">
        <CodeBlock
          code={JSON.stringify(
            details.configuration.service_definition,
            null,
            2
          )}
          language="json"
        />
      </Section>

      {/* Load Balancer Section */}
      <Section title="Load Balancer Configuration">
        {details.configuration.load_balancer ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                label="Load Balancer Type"
                value={details.configuration.load_balancer.type}
              />
              <InfoItem
                label="Target Group ARN"
                value={details.configuration.load_balancer.target_group_arn}
                truncate
              />
            </div>
            <CodeBlock
              code={JSON.stringify(
                details.configuration.load_balancer.config,
                null,
                2
              )}
              language="json"
            />
          </div>
        ) : (
          <EmptyState icon={Settings} message="No load balancer configured" />
        )}
      </Section>

      {/* Auto Scaling Section */}
      <Section title="Auto Scaling Configuration">
        {details.configuration.auto_scaling ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoItem
                label="Min Capacity"
                value={details.configuration.auto_scaling.min_capacity}
              />
              <InfoItem
                label="Max Capacity"
                value={details.configuration.auto_scaling.max_capacity}
              />
              <InfoItem
                label="Status"
                value={details.configuration.auto_scaling.status}
              />
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Scaling Policies
              </h4>
              <div className="space-y-4">
                {details.configuration.auto_scaling.policies.map(
                  (policy, index) => (
                    <PolicyCard key={index} policy={policy} />
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState icon={Settings} message="No auto scaling configured" />
        )}
      </Section>

      {/* Network Configuration Section */}
      <Section title="Network Configuration">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              label="Network Mode"
              value={details.configuration.network.network_mode}
            />
            <InfoItem
              label="Assign Public IP"
              value={
                details.configuration.network.assign_public_ip ? "Yes" : "No"
              }
            />
          </div>

          <InfoList
            label="Subnets"
            items={details.configuration.network.subnets}
          />
          <InfoList
            label="Security Groups"
            items={details.configuration.network.security_groups}
          />
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
      <div
        className={subtitle ? "flex items-center justify-between mb-4" : "mb-4"}
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {subtitle && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function CollapsibleInfoItem({
  label,
  value,
  additional,
  truncate = false,
  defaultCollapsed = false,
}: {
  label: string;
  value: React.ReactNode;
  additional?: React.ReactNode;
  truncate?: boolean;
  defaultCollapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const isPlainText = typeof value === "string" || typeof value === "number";

  return (
    <div className="mb-2">
      <div
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
          {label}
        </span>
        <span className="text-gray-400 dark:text-gray-500 text-xs">
          {isCollapsed ? "▼" : "▲"}
        </span>
      </div>

      {!isCollapsed && (
        <div className="mt-1">
          {isPlainText ? (
            <p
              className={`font-medium text-gray-900 dark:text-gray-100 ${
                truncate ? "truncate" : ""
              }`}
            >
              {value}
            </p>
          ) : (
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {value}
            </div>
          )}
          {additional}
        </div>
      )}
    </div>
  );
}

function InfoList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusIndicator({ active }: { active: boolean }) {
  return (
    <div
      className={`w-2 h-2 rounded-full mr-2 ${
        active ? "bg-green-500" : "bg-red-500"
      }`}
    ></div>
  );
}

function StatusBadge({
  status,
  type,
}: {
  status: string;
  type?: "success" | "danger" | "info";
}) {
  let className = "";

  if (type) {
    className =
      type === "success"
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
        : type === "danger"
        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
  } else {
    className =
      status === "COMPLETED"
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
        : status === "FAILED"
        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
  }

  return (
    <span
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${className}`}
    >
      {status}
    </span>
  );
}

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
      <div
        className="bg-blue-500 h-2 rounded-full"
        style={{ width: `${Math.min(value, max)}%` }}
      ></div>
    </div>
  );
}

function ProgressIndicator({
  label,
  progress,
  additionalText,
}: {
  label: string;
  progress: number;
  additionalText?: string;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-blue-500 h-2.5 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {additionalText && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{progress}% complete</span>
          <span>{additionalText}</span>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress?: number;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </p>
      {progress !== undefined && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full ${getUtilizationColor(progress)}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

function HealthStatusCard({
  isHealthy,
  runningTasks,
  desiredCount,
}: {
  isHealthy: boolean;
  runningTasks: number;
  desiredCount: number;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">Health Status</p>
      <div className="flex items-center mt-2">
        {isHealthy ? (
          <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
        ) : (
          <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
        )}
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isHealthy ? "Healthy" : "Unhealthy"}
        </p>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        {isHealthy
          ? "All tasks are running as expected"
          : `${desiredCount - runningTasks} tasks are not running`}
      </p>
    </div>
  );
}

function MetricChart({
  title,
  data,
  color,
}: {
  title: string;
  data: any;
  color: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1">{title}</p>
      <MetricsChart data={data} label={title} color={color} />
    </div>
  );
}
function formatToIST(datetime: string | null): string {
  if (!datetime) return "N/A";

  const date = new Date(datetime);
  if (isNaN(date.getTime())) return "Invalid Date";

  const istOffsetMinutes = 5.5 * 60;
  const istDate = new Date(date.getTime() + istOffsetMinutes * 60 * 1000);

  const hours = istDate.getHours().toString().padStart(2, "0");
  const minutes = istDate.getMinutes().toString().padStart(2, "0");
  const day = istDate.getDate().toString().padStart(2, "0");
  const month = (istDate.getMonth() + 1).toString().padStart(2, "0");
  const year = istDate.getFullYear();

  return `${hours}:${minutes} ${day}:${month}:${year}`;
}

function TableHeader({ label }: { label: string }) {
  return (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
    >
      {label}
    </th>
  );
}

function TableCell({
  value,
  children,
  truncate = false,
}: {
  value?: string;
  children?: React.ReactNode;
  truncate?: boolean;
}) {
  return (
    <td
      className={`px-6 py-4 whitespace-nowrap text-sm ${
        truncate ? "truncate max-w-xs" : ""
      } ${value ? "text-gray-500 dark:text-gray-400" : ""}`}
    >
      {children || value}
    </td>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

function InfoItem({
  label,
  value,
  additional,
  truncate = false,
}: {
  label: string;
  value: React.ReactNode;
  additional?: React.ReactNode;
  truncate?: boolean;
}) {
  const isPlainText = typeof value === "string" || typeof value === "number";

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      {isPlainText ? (
        <p
          className={`font-medium text-gray-900 dark:text-gray-100 ${
            truncate ? "truncate" : ""
          }`}
        >
          {value}
        </p>
      ) : (
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {value}
        </div>
      )}
      {additional}
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <StatusIndicator active={task.health_status === "HEALTHY"} />
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {task.task_id}
          </p>
        </div>
        <StatusBadge status={task.health_status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <InfoItem label="Started At" value={formatToIST(task.started_at)} />
        <InfoItem label="Availability Zone" value={task.availability_zone} />
      </div>
      <CollapsibleInfoItem
        label="Task Definition"
        value={
          <CodeBlock
            code={JSON.stringify(task.task_definition, null, 2)}
            language="json"
          />
        }
        defaultCollapsed={true}
      />
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const color =
    event.type === "ERROR"
      ? "bg-red-500"
      : event.type === "WARNING"
      ? "bg-yellow-500"
      : "bg-blue-500";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start">
        <div className={`mt-1 w-2 h-2 rounded-full mr-3 ${color}`}></div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {event.type}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatToIST(event.timestamp)}
            </p>
          </div>
          <p className="text-gray-700 dark:text-gray-300">{event.message}</p>
        </div>
      </div>
    </div>
  );
}

function PolicyCard({ policy }: { policy: any }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {policy.name}
        </p>
        <StatusBadge status={policy.type} type="info" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoItem label="Metric" value={policy.metric} />
        <InfoItem label="Target Value" value={policy.target_value} />
      </div>
    </div>
  );
}

function getUtilizationColor(value: number): string {
  if (value > 80) return "bg-red-500";
  if (value > 60) return "bg-yellow-500";
  return "bg-green-500";
}
