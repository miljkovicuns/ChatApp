// services/GroupService.java
package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.*;
import com.ftn.sr192024.messenger.models.dto.GroupMemberDto;
import com.ftn.sr192024.messenger.repository.*;
import com.ftn.sr192024.messenger.security.JWTService;
import com.ftn.sr192024.messenger.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final GroupMembershipRepository membershipRepository;
    private final GroupInviteRepository inviteRepository;
    private final LocalImageRepo localImageRepo;
    private final JWTService jwtService;
    private final MessageService messageService;

    // Create group with image
    @Transactional
    public Chat createGroup(String name, String description, byte[] image, List<UUID> participantIds, UUID creatorId) {
        List<User> participants = userRepository.findAllById(participantIds);
        if (participants.size() != participantIds.size()) {
            throw new RuntimeException("One or more users not found");
        }

        Chat chat = new Chat();
        chat.setGroupChat(true);
        chat.setName(name);
        chat.setDescription(description);
        chat.setDateCreated(LocalDateTime.now());
        chat = chatRepository.save(chat);

        // Add creator as ADMIN
        User creator = userRepository.findById(creatorId).orElseThrow();
        GroupMembership creatorMembership = new GroupMembership();
        creatorMembership.setUser(creator);
        creatorMembership.setChat(chat);
        creatorMembership.setRole(GroupRole.ADMIN);
        membershipRepository.save(creatorMembership);

        // Add participants as MEMBER
        for (User user : participants) {
            if (user.getId().equals(creatorId)) continue;
            GroupMembership membership = new GroupMembership();
            membership.setUser(user);
            membership.setChat(chat);
            membership.setRole(GroupRole.MEMBER);
            membershipRepository.save(membership);
        }

        // Update chat participants list
        chat.setParticipants(participants);
        chat.getParticipants().add(creator);
        Chat savedChat = chatRepository.save(chat);
        localImageRepo.saveImage(image,savedChat.getId());
        return savedChat;
    }

    // Update group details (name, description, image)
    @Transactional
    public Chat updateGroup(UUID chatId, String name, String description, byte[] image, UUID actorId) {
        Chat chat = chatRepository.findById(chatId).orElseThrow();

        User actor = userRepository.findById(actorId).orElseThrow();
        StringBuilder changeLog = new StringBuilder();

        if (name != null && !name.isBlank() && !name.equals(chat.getName())) {
            changeLog.append("changed group name to '").append(name).append("'");
            chat.setName(name);
        }
        if (description != null && !description.equals(chat.getDescription())) {
            if (!changeLog.isEmpty()) changeLog.append(" and ");
            changeLog.append("changed description");
            chat.setDescription(description);
        }
        if (image != null) localImageRepo.saveImage(image,chatId);

        chat = chatRepository.save(chat);

        if (!changeLog.isEmpty()) {
            String systemMsg = actor.getUsername() + " " + changeLog;
            messageService.createSystemMessage(chatId, systemMsg);
        }

        return chat;
    }

    // Add members
    @Transactional
    public Chat addMembers(UUID chatId, List<UUID> userIds, UUID actorId) {
        Chat chat = chatRepository.findById(chatId).orElseThrow();
        User actor = userRepository.findById(actorId).orElseThrow();
        List<User> addedUsers = new ArrayList<>();

        for (UUID userId : userIds) {
            if (!membershipRepository.existsByUserIdAndChatId(userId, chatId)) {
                User user = userRepository.findById(userId).orElseThrow();
                GroupMembership membership = new GroupMembership();
                membership.setUser(user);
                membership.setChat(chat);
                membership.setRole(GroupRole.MEMBER);
                membershipRepository.save(membership);
                chat.getParticipants().add(user);
                addedUsers.add(user);
            }
        }

        chatRepository.save(chat);

        if (!addedUsers.isEmpty()) {
            String names = addedUsers.stream()
                    .map(User::getUsername)
                    .collect(Collectors.joining(", "));
            String systemMsg = actor.getUsername() + " added " + names;
            messageService.createSystemMessage(chatId, systemMsg);
        }

        return chat;
    }

    // Remove member
    @Transactional
    public Chat removeMember(UUID chatId, UUID userId, UUID actorId) {
        Chat chat = chatRepository.findById(chatId).orElseThrow();
        // Prevent removing last admin
        List<GroupMembership> admins = membershipRepository.findByChatId(chatId).stream()
                .filter(m -> m.getRole() == GroupRole.ADMIN)
                .toList();
        if (admins.size() == 1 && admins.get(0).getUser().getId().equals(userId)) {
            throw new RuntimeException("Cannot remove the only admin of the group");
        }
        membershipRepository.deleteByChatIdAndUserId(chatId, userId);
        chat.getParticipants().removeIf(u -> u.getId().equals(userId));

        User actor = userRepository.findById(actorId).orElseThrow();
        User removedUser = userRepository.findById(userId).orElseThrow();
        String systemMsg = actor.getUsername() + " removed " + removedUser.getUsername();
        messageService.createSystemMessage(chatId, systemMsg);
        return chatRepository.save(chat);
    }

    // Change member role
    @Transactional
    public void updateMemberRole(UUID chatId, UUID userId, GroupRole newRole, UUID actorId) {
        GroupMembership membership = membershipRepository.findByUserIdAndChatId(userId, chatId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this group"));
        membership.setRole(newRole);
        membershipRepository.save(membership);

        User actor = userRepository.findById(actorId).orElseThrow();
        User targetUser = userRepository.findById(userId).orElseThrow();
        String systemMsg = actor.getUsername() + " changed " + targetUser.getUsername()
                + "'s role to " + newRole.name();
        messageService.createSystemMessage(chatId, systemMsg);
    }

    // Get all members with roles
    public List<GroupMemberDto> getMembers(UUID chatId) {
        return membershipRepository.findByChatId(chatId).stream()
                .map(m -> new GroupMemberDto(
                        m.getUser().getId(),
                        m.getUser().getUsername(),
                        m.getRole()
                ))
                .collect(Collectors.toList());
    }

    // Generate invite link
    @Transactional
    public String generateInviteLink(UUID chatId) {
        // Delete old invites for this chat
        inviteRepository.deleteByChatId(chatId);

        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        GroupInvite invite = new GroupInvite();
        invite.setToken(token);
        invite.setChatId(chatId);
        invite.setExpiry(LocalDateTime.now().plusDays(7));
        invite.setUsed(false);
        inviteRepository.save(invite);

        return token;
    }

    // Join group via invite link
    @Transactional
    public Chat joinGroupByToken(String token, UUID userId) {
        GroupInvite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invite link"));
        if (invite.isUsed() || invite.getExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Invite link expired or already used");
        }

        Chat chat = chatRepository.findById(invite.getChatId()).orElseThrow();
        User user = userRepository.findById(userId).orElseThrow();

        if (membershipRepository.existsByUserIdAndChatId(userId, chat.getId())) {
            throw new RuntimeException("User is already a member");
        }

        GroupMembership membership = new GroupMembership();
        membership.setUser(user);
        membership.setChat(chat);
        membership.setRole(GroupRole.MEMBER);
        membershipRepository.save(membership);

        chat.getParticipants().add(user);
        chatRepository.save(chat);

        invite.setUsed(true);
        inviteRepository.save(invite);

        return chat;
    }

    @Transactional
    public Chat joinGroupWithJwtToken(String token) {
        // 1. Extract groupId from token (validates signature & expiration)
        UUID chatId = jwtService.getGroupIdFromInviteToken(token);

        // 2. Get the current user
        UUID userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 3. Check if group exists
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // 4. Check if user is already a member
        if (membershipRepository.existsByUserIdAndChatId(userId, chatId)) {
            throw new RuntimeException("User is already a member of this group");
        }

        // 5. Create membership with MEMBER role
        GroupMembership membership = new GroupMembership();
        membership.setUser(user);
        membership.setChat(chat);
        membership.setRole(GroupRole.MEMBER);
        membershipRepository.save(membership);

        // 6. Add user to chat participants list
        chat.getParticipants().add(user);
        chatRepository.save(chat);

        return chat;
    }
}