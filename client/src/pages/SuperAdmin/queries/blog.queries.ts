import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  fetchAdminBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  publishBlogPost,
  unpublishBlogPost,
} from "../../../services/adminApi";
import { adminQueryKeys } from "./queryKeys";

interface BlogParams {
  search: string;
}

export function useAdminBlogPosts(params: BlogParams) {
  return useQuery({
    queryKey: adminQueryKeys.blog.list(params),
    queryFn: () =>
      fetchAdminBlogPosts(params.search ? { q: params.search } : {}).then(
        (r) => r.data
      ),
    keepPreviousData: true,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createBlogPost(data),
    onSuccess: () => {
      toast.success("Post created");
      queryClient.invalidateQueries(adminQueryKeys.blog.all());
    },
    onError: () => toast.error("Failed to create post"),
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      data,
    }: {
      slug: string;
      data: Record<string, unknown>;
    }) => updateBlogPost(slug, data),
    onSuccess: () => {
      toast.success("Post updated");
      queryClient.invalidateQueries(adminQueryKeys.blog.all());
    },
    onError: () => toast.error("Failed to update post"),
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => deleteBlogPost(slug),
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries(adminQueryKeys.blog.all());
    },
    onError: () => toast.error("Failed to delete post"),
  });
}

export function usePublishBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => publishBlogPost(slug),
    onSuccess: () => {
      toast.success("Post published");
      queryClient.invalidateQueries(adminQueryKeys.blog.all());
    },
    onError: () => toast.error("Failed to publish post"),
  });
}

export function useUnpublishBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => unpublishBlogPost(slug),
    onSuccess: () => {
      toast.success("Post unpublished");
      queryClient.invalidateQueries(adminQueryKeys.blog.all());
    },
    onError: () => toast.error("Failed to unpublish post"),
  });
}
