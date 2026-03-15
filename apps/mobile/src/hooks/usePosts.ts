import { useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { apiFetch } from './useApi';
import { usePostsStore } from '../stores/posts';
import type { TradePost, CreatePostInput } from '@pocket-trade-hub/shared';

interface MyPostsResponse {
  posts: TradePost[];
}

export function usePosts() {
  const myPosts = usePostsStore((s) => s.myPosts);
  const myPostsLoading = usePostsStore((s) => s.myPostsLoading);

  const fetchMyPosts = useCallback(async () => {
    usePostsStore.getState().setMyPostsLoading(true);
    try {
      const data = await apiFetch<MyPostsResponse>('/posts/mine');
      usePostsStore.getState().setMyPosts(data.posts);
    } catch (err) {
      console.error('[fetchMyPosts] error:', err);
    } finally {
      usePostsStore.getState().setMyPostsLoading(false);
    }
  }, []);

  const createPost = useCallback(
    async (input: CreatePostInput): Promise<TradePost | null> => {
      try {
        const result = await apiFetch<{ post: TradePost }>('/posts', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        // Optimistic add to my posts
        usePostsStore.getState().addMyPost(result.post);
        Toast.show({
          type: 'success',
          text1: 'Post created!',
          text2: `Your ${input.type} post is now live.`,
        });
        return result.post;
      } catch (err: any) {
        const message = err?.message || 'Failed to create post';
        if (message.includes('limit') || message.includes('403')) {
          Toast.show({
            type: 'error',
            text1: 'Post limit reached',
            text2: 'Upgrade to premium for unlimited posts.',
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Failed to create post',
            text2: 'Please try again.',
          });
        }
        return null;
      }
    },
    [],
  );

  const closePost = useCallback(async (postId: string) => {
    // Optimistic update
    usePostsStore.getState().updatePostStatus(postId, 'closed');
    try {
      await apiFetch<{ post: TradePost }>(`/posts/${postId}/close`, {
        method: 'PUT',
      });
      Toast.show({ type: 'success', text1: 'Post closed' });
    } catch {
      // Revert
      usePostsStore.getState().updatePostStatus(postId, 'active');
      Toast.show({
        type: 'error',
        text1: 'Failed to close post',
        text2: 'Please try again.',
      });
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    // Optimistic remove
    const prev = usePostsStore.getState().myPosts;
    usePostsStore.getState().removeMyPost(postId);
    try {
      await apiFetch(`/posts/${postId}`, { method: 'DELETE' });
      Toast.show({ type: 'success', text1: 'Post deleted' });
    } catch {
      // Revert
      usePostsStore.getState().setMyPosts(prev);
      Toast.show({
        type: 'error',
        text1: 'Failed to delete post',
        text2: 'Please try again.',
      });
    }
  }, []);

  return {
    myPosts,
    myPostsLoading,
    fetchMyPosts,
    createPost,
    closePost,
    deletePost,
  };
}
