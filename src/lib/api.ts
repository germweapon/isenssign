/**
 * Typed API client for iSensSign frontend.
 * All functions call internal Next.js API routes via fetch().
 */

const API_BASE = "/api/v1";
const NOTIFY_BASE = "/api/notifications";
const BAROCERT_BASE = "/api/barocert";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiListResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiSingleResponse<T> {
  data: T;
}

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

export interface TemplateDTO {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  author: { id: string; firstName: string | null; email: string } | null;
  folder: { id: string; name: string } | null;
  _count: { submissions: number };
}

export interface SubmitterDTO {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  completedAt: string | null;
  verificationMethod: string | null;
  verifiedAt: string | null;
}

export interface SubmissionEventDTO {
  id: string;
  eventType: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface SubmissionDTO {
  id: string;
  slug?: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  completedAt?: string | null;
  template: { id: string; name: string } | null;
  createdBy: { id: string; firstName: string | null; email: string } | null;
  submitters: SubmitterDTO[];
  submissionEvents?: SubmissionEventDTO[];
}

export interface NotificationRequest {
  type: "signing_request" | "signing_reminder" | "signing_complete";
  channel: "email" | "kakao" | "sms";
  recipient: {
    name: string;
    email?: string;
    phone?: string;
  };
  data: {
    senderName: string;
    documentName: string;
    signingUrl?: string;
    downloadUrl?: string;
    expiresAt?: string;
    message?: string;
  };
}

export interface VerificationRequest {
  provider: "kakao" | "naver" | "toss";
  type: "identity" | "sign";
  receiverInfo: {
    receiverHP: string;
    receiverName: string;
    receiverBirthday: string;
  };
  token?: string;
  reqTitle?: string;
  reqMessage?: string;
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, json as ApiErrorBody);
  }

  return json as T;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStatsDTO {
  totalTemplates: number;
  pendingSignatures: number;
  completedSignatures: number;
  monthlySignatures: number;
}

export async function fetchDashboardStats(): Promise<DashboardStatsDTO> {
  return request<DashboardStatsDTO>(`${API_BASE}/dashboard/stats`);
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function fetchTemplates(params?: {
  page?: number;
  limit?: number;
  search?: string;
  folderId?: string;
}): Promise<ApiListResponse<TemplateDTO>> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.search) sp.set("search", params.search);
  if (params?.folderId) sp.set("folderId", params.folderId);

  return request<ApiListResponse<TemplateDTO>>(
    `${API_BASE}/templates?${sp.toString()}`
  );
}

export async function fetchTemplate(
  id: string
): Promise<ApiSingleResponse<TemplateDTO>> {
  return request<ApiSingleResponse<TemplateDTO>>(
    `${API_BASE}/templates/${id}`
  );
}

export async function createTemplate(data: {
  name: string;
  folderId?: string;
}): Promise<ApiSingleResponse<TemplateDTO>> {
  return request<ApiSingleResponse<TemplateDTO>>(`${API_BASE}/templates`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(
  id: string
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/templates/${id}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export interface FolderDTO {
  id: string;
  name: string;
  createdAt: string;
  _count: { templates: number };
}

export async function fetchFolders(): Promise<{ data: FolderDTO[] }> {
  return request<{ data: FolderDTO[] }>(`${API_BASE}/folders`);
}

export interface TemplateSharingDTO {
  id: string;
  slug: string;
  submitters: unknown;
  expiresAt: string | null;
  createdAt: string;
  templateId: string;
}

export async function fetchTemplateSharing(
  templateId: string
): Promise<ApiSingleResponse<TemplateSharingDTO>> {
  return request<ApiSingleResponse<TemplateSharingDTO>>(
    `${API_BASE}/templates/${templateId}/sharing`
  );
}

export async function createFolder(data: {
  name: string;
  parentFolderId?: string;
}): Promise<ApiSingleResponse<FolderDTO>> {
  return request<ApiSingleResponse<FolderDTO>>(`${API_BASE}/folders`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export async function fetchSubmissions(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ApiListResponse<SubmissionDTO>> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.status) sp.set("status", params.status);

  return request<ApiListResponse<SubmissionDTO>>(
    `${API_BASE}/submissions?${sp.toString()}`
  );
}

export async function fetchSubmission(
  id: string
): Promise<ApiSingleResponse<SubmissionDTO>> {
  return request<ApiSingleResponse<SubmissionDTO>>(
    `${API_BASE}/submissions/${id}`
  );
}

export interface CreateSubmissionRequest {
  templateId: string;
  submitterOrder?: "RANDOM" | "SEQUENTIAL";
  expiresAt?: string;
  submitters: Array<{
    name: string;
    email?: string;
    phone?: string;
    role?: string;
    notificationChannel?: "email" | "kakao" | "sms";
    verificationMethod?:
      | "NONE"
      | "EMAIL"
      | "SMS"
      | "KAKAO_CERT"
      | "NAVER_CERT"
      | "TOSS_CERT";
  }>;
}

export async function createSubmission(
  data: CreateSubmissionRequest
): Promise<ApiSingleResponse<SubmissionDTO>> {
  return request<ApiSingleResponse<SubmissionDTO>>(
    `${API_BASE}/submissions`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function sendNotification(
  data: NotificationRequest
): Promise<{ success: boolean; channel: string; message: string; id?: string }> {
  return request<{
    success: boolean;
    channel: string;
    message: string;
    id?: string;
  }>(NOTIFY_BASE, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Verification (Barocert)
// ---------------------------------------------------------------------------

export async function requestVerification(
  data: VerificationRequest
): Promise<{ receiptID: string; provider: string; type: string }> {
  return request<{ receiptID: string; provider: string; type: string }>(
    BAROCERT_BASE,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function checkVerification(
  receiptId: string,
  provider: string,
  type: string = "identity",
  verify: boolean = false
): Promise<{ status: unknown; result?: unknown }> {
  const sp = new URLSearchParams({
    receiptId,
    provider,
    type,
    ...(verify && { verify: "true" }),
  });

  return request<{ status: unknown; result?: unknown }>(
    `${BAROCERT_BASE}?${sp.toString()}`
  );
}
