import { API_BASE_URL } from "../../config/api";

export interface Category {
  id: number;
  name: string;
  create_at: string;
}

export interface CategoriesResponse {
  message: string;
  data: Category[];
}

export const getCategories = async (): Promise<CategoriesResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/jobs/categories`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch categories");
  }

  return response.json();
};
