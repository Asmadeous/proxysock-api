import api from "./api";
import { type ExtendedPost } from "../data/blogPost";

export interface BlogListResponse {
    posts: ExtendedPost[];
    total: number;
    categories: { name: string; count: number }[];
}

export const getBlogPosts = async (params: { category?: string; q?: string; featured?: boolean } = {}) => {
    const { data } = await api.get<BlogListResponse>("/web/api/blog_posts", { params });
    return data;
};

export const getBlogPost = async (slug: string) => {
    const { data } = await api.get<ExtendedPost>(`/web/api/blog_posts/${slug}`);
    return data;
};
