// models/group-member.dto.ts
export interface GroupMemberDto {
  userId: string;
  username: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
}
