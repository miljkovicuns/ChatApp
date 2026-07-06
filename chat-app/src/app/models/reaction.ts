export type ReactionType = 'LIKE' | 'LOVE' | 'LAUGH' | 'SAD' | 'ANGRY' | 'THUMBS_UP';

export interface MessageReaction {
  id: string;
  userId: string;
  username: string;
  reactionType: ReactionType;
}

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  LAUGH: '😂',
  SAD: '😢',
  ANGRY: '😠',
  THUMBS_UP: '💪'
};

export const REACTION_TYPES: ReactionType[] = ['LIKE', 'LOVE', 'LAUGH', 'SAD', 'ANGRY', 'THUMBS_UP'];
