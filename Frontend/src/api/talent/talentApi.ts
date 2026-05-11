import { API_BASE_URL } from "../../config/api";

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface TalentProfile {
  name: string;
  email: string;
  profile_image?: string;
  about?: string;
  education?: string;
  experience?: string;
  languages?: string;
  linkedin?: string;
  github?: string;
  resume_url?: string;
  Location?: string;
  HourlyRate?: number | string;
  skills: string[];
}

export interface UpdateProfileData {
  education?: string;
  experience?: string;
  languages?: string;
  linkedin?: string;
  github?: string;
  resume_url?: string;
  about?: string;
  Location?: string;
  HourlyRate?: string;
}

export interface PortfolioProject {
  id?: number;
  user_id?: number;
  title: string;
  description?: string;
  technologies?: string[];
  image_url?: string;
  project_url?: string;
  github_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Certificate {
  id: number;
  user_id?: number;
  title: string;
  organization?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  created_at?: string;
}

export interface Skill {
  id: number;
  skill_name: string;
}

// Get talent profile
export const getTalentProfile = async (): Promise<{
  message: string;
  data: TalentProfile;
  incomplete?: boolean;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/talents/talentProfile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching talent profile:", error);
    throw error;
  }
};

// Update talent profile
export const updateTalentProfile = async (
  profileData: UpdateProfileData,
): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/talents/talentProfile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update profile");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating talent profile:", error);
    throw error;
  }
};

// Get token balance
export const getTokenBalance = async (): Promise<{ balance: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/talents/tokenBalance`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching token balance:", error);
    throw error;
  }
};

// Add skills to profile
export const addSkills = async (
  skill_name: string,
): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/talents/addSkills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ skill_name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add skills");
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding skills:", error);
    throw error;
  }
};

// Get portfolio
export const getPortfolio = async (): Promise<{
  message: string;
  data: PortfolioProject[];
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/talents/portfolio`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    throw error;
  }
};

// Create portfolio project with optional image
export const createPortfolio = async (
  projectData: PortfolioProject,
  imageFile?: File,
): Promise<{
  message: string;
  data: { id: number; title: string; image_url?: string };
}> => {
  try {
    const formData = new FormData();
    formData.append("title", projectData.title);
    if (projectData.description)
      formData.append("description", projectData.description);
    if (projectData.technologies)
      formData.append("technologies", JSON.stringify(projectData.technologies));
    if (projectData.project_url)
      formData.append("project_url", projectData.project_url);
    if (projectData.github_url)
      formData.append("github_url", projectData.github_url);
    if (imageFile) formData.append("image", imageFile);

    const response = await fetch(`${API_BASE_URL}/api/talents/portfolio`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create portfolio project");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating portfolio:", error);
    throw error;
  }
};

// Update portfolio project with optional image
export const updatePortfolio = async (
  projectId: number,
  projectData: Partial<PortfolioProject>,
  imageFile?: File,
): Promise<{ message: string; data: any }> => {
  try {
    const formData = new FormData();
    if (projectData.title !== undefined)
      formData.append("title", projectData.title);
    if (projectData.description !== undefined)
      formData.append("description", projectData.description);
    if (projectData.technologies !== undefined)
      formData.append("technologies", JSON.stringify(projectData.technologies));
    if (projectData.project_url !== undefined)
      formData.append("project_url", projectData.project_url);
    if (projectData.github_url !== undefined)
      formData.append("github_url", projectData.github_url);
    if (imageFile) formData.append("image", imageFile);

    const response = await fetch(
      `${API_BASE_URL}/api/talents/portfolio/${projectId}`,
      {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update portfolio project");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating portfolio:", error);
    throw error;
  }
};

// Delete portfolio project
export const deletePortfolio = async (
  projectId: number,
): Promise<{ message: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/talents/portfolio/${projectId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete portfolio project");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting portfolio:", error);
    throw error;
  }
};

// Get all available skills
export const getAllSkills = async (): Promise<{
  message: string;
  data: Skill[];
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/talents/skills`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching skills:", error);
    throw error;
  }
};

// Get my skills
export const getMySkills = async (): Promise<{
  message: string;
  data: Skill[];
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/talents/my-skills`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching my skills:", error);
    throw error;
  }
};

// ── Certificates ─────────────────────────────────────────────────────────────

export const getCertificates = async (): Promise<{ message: string; data: Certificate[] }> => {
  const response = await fetch(`${API_BASE_URL}/api/talents/certificates`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch certificates");
  return response.json();
};

export const addCertificate = async (
  data: Omit<Certificate, "id" | "user_id" | "created_at">,
): Promise<{ message: string; data: Certificate }> => {
  const response = await fetch(`${API_BASE_URL}/api/talents/certificates`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to add certificate");
  }
  return response.json();
};

export const updateCertificate = async (
  id: number,
  data: Partial<Omit<Certificate, "id" | "user_id" | "created_at">>,
): Promise<{ message: string; data: Certificate }> => {
  const response = await fetch(`${API_BASE_URL}/api/talents/certificates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to update certificate");
  }
  return response.json();
};

export const deleteCertificate = async (id: number): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/talents/certificates/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to delete certificate");
  }
  return response.json();
};

// Upload profile image
export const uploadProfileImage = async (
  imageFile: File,
): Promise<{ message: string; imageUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${API_BASE_URL}/api/talents/upload-profile`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload profile image");
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};

// ── Networking & Connections ──────────────────────────────────────────────────

export interface Connection {
  id: number;
  user_id?: number;
  sender_id?: number;
  talent_id?: number;
  name: string;
  profile_image?: string;
  about?: string;
  skills?: string;
  linkedin?: string;
  github?: string;
}

export const sendConnectionRequest = async (
  receiver_id: number,
): Promise<{ message: string; data: { connection_id: number } }> => {
  const response = await fetch(`${API_BASE_URL}/api/talents/sendRequest`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ receiver_id }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to send connection request");
  }
  return response.json();
};

export const getRequestedConnections = async (): Promise<{
  connections: Connection[];
}> => {
  const response = await fetch(
    `${API_BASE_URL}/api/talents/requestedConnections`,
    {
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    },
  );
  if (!response.ok) throw new Error("Failed to fetch requested connections");
  return response.json();
};

export const acceptConnectionRequest = async (
  connection_id: number,
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/talents/acceptRequest`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ connection_id }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to accept connection request");
  }
  return response.json();
};

export const getMyConnections = async (): Promise<{
  connections: Connection[];
}> => {
  const response = await fetch(`${API_BASE_URL}/api/talents/myConnections`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch connections");
  return response.json();
};

export const getConnectionStatuses = async (): Promise<{
  statuses: Record<number, { status: "pending" | "accepted" | "rejected"; direction: "sent" | "received"; connection_id: number }>;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/talents/connection-statuses`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch connection statuses");
  return response.json();
};

// ── Messaging ─────────────────────────────────────────────────────────────────

export interface Message {
  id: number;
  sender_id: number;
  reciver_id: number;
  content: string;
  created_at: string;
  name?: string;
  profile_image?: string;
}

export const sendMessage = async (
  reciver_id: number,
  content: string,
): Promise<{ message: string; data: { message_id: number } }> => {
  const response = await fetch(`${API_BASE_URL}/api/talents/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ reciver_id, content }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to send message");
  }
  return response.json();
};

export const getMessages = async (reciver_id: number): Promise<{
  messages: Message[];
}> => {
  const response = await fetch(
    `${API_BASE_URL}/api/talents/messages?reciver_id=${reciver_id}`,
    {
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    },
  );
  if (!response.ok) throw new Error("Failed to fetch messages");
  return response.json();
};

// ── Skill Endorsements ────────────────────────────────────────────────────────

export interface SkillEndorsement {
  id: number;
  skill_name: string;
  endorsement_count: number;
  endorsed_by?: string;
}

export const endorseSkill = async (
  talent_id: number,
  skill_id: number,
): Promise<{ message: string; data: { endorsement_id: number } }> => {
  const response = await fetch(`${API_BASE_URL}/api/talents/endorseSkill`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ talent_id, skill_id }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to endorse skill");
  }
  return response.json();
};

export const getSkillEndorsements = async (): Promise<{
  endorsements: SkillEndorsement[];
}> => {
  const response = await fetch(
    `${API_BASE_URL}/api/talents/skillEndorsements`,
    {
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    },
  );
  if (!response.ok) throw new Error("Failed to fetch skill endorsements");
  return response.json();
};

// ── Talent Network ────────────────────────────────────────────────────────────

export interface NetworkTalent extends Connection {
  total_endorsements: number;
}

export const getTalentNetwork = async (): Promise<{
  network: NetworkTalent[];
}> => {
  const response = await fetch(`${API_BASE_URL}/api/talents/network`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch talent network");
  return response.json();
};

// ── All Talents (for Network/Discover page) ───────────────────────────────────

export interface TalentCard {
  id: number;
  name: string;
  email: string;
  profile_image?: string;
  about?: string;
  skills: string[];
  location?: string;
  linkedin?: string;
  github?: string;
}

export const getAllTalents = async (options?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ talents: TalentCard[]; pagination: any }> => {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", options.page.toString());
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.search) params.append("search", options.search);
  const response = await fetch(`${API_BASE_URL}/api/talents/all-talents?${params}`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch talents");
  const data = await response.json();
  return {
    talents: (data.talents || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      profile_image: t.profile_image,
      about: t.about,
      skills: Array.isArray(t.skills) ? t.skills : [],
      location: t.Location || t.location,
      linkedin: t.linkedin,
      github: t.github,
    })),
    pagination: data.pagination || {},
  };
};

export const getVerificationStatus = async (): Promise<{
  is_verified: boolean;
  request: { id: number; status: string; admin_note?: string; created_at: string } | null;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/talents/verification-status`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch verification status");
  return response.json();
};

export const requestVerification = async (nationalIdFile: File, message?: string): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append("national_id", nationalIdFile);
  if (message) formData.append("message", message);
  const response = await fetch(`${API_BASE_URL}/api/talents/request-verification`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to submit verification request");
  return data;
};

// ── Notifications ─────────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  type: "connection_request" | "connection_accepted" | "new_message";
  title: string;
  message: string;
  connection_id: number;
  sender_talent_id: number;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_image?: string;
}

export const getNotifications = async (): Promise<{
  notifications: Notification[];
  unread_count: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch notifications");
  return response.json();
};

export const markNotificationRead = async (id: number): Promise<void> => {
  await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
};

export const acceptConnectionNotification = async (connection_id: number): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/notifications/accept/${connection_id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to accept connection");
  }
  return response.json();
};

export const declineConnectionNotification = async (connection_id: number): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/notifications/decline/${connection_id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to decline connection");
  }
  return response.json();
};

// ── Real Messaging API ────────────────────────────────────────────────────────

export interface RealMessage {
  id: number;
  sender_id: number;
  reciver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_image?: string;
}

export interface Conversation {
  user_id: number;
  name: string;
  profile_image?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export const getConversations = async (): Promise<{ conversations: Conversation[] }> => {
  const response = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch conversations");
  return response.json();
};

export const getRealMessages = async (reciver_id: number): Promise<{ messages: RealMessage[] }> => {
  const response = await fetch(`${API_BASE_URL}/api/messages?reciver_id=${reciver_id}`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to fetch messages");
  return response.json();
};

export const sendRealMessage = async (reciver_id: number, content: string): Promise<{ message: string; data: RealMessage }> => {
  const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ reciver_id, content }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to send message");
  }
  return response.json();
};

export const markConversationRead = async (sender_id: number): Promise<void> => {
  await fetch(`${API_BASE_URL}/api/messages/${sender_id}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
};
