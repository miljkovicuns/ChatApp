// controllers/GroupController.java
package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.Chat;
import com.ftn.sr192024.messenger.models.GroupRole;
import com.ftn.sr192024.messenger.models.dto.CreateGroupRequest;
import com.ftn.sr192024.messenger.models.dto.GroupMemberDto;
import com.ftn.sr192024.messenger.models.dto.InviteLinkResponse;
import com.ftn.sr192024.messenger.models.dto.UpdateGroupRequest;
import com.ftn.sr192024.messenger.security.JWTService;
import com.ftn.sr192024.messenger.security.SecurityUtils;
import com.ftn.sr192024.messenger.services.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import static com.ftn.sr192024.messenger.security.SecurityUtils.getCurrentUserId;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService groupService;
    private final JWTService jwtService;

    @PostMapping
    public ResponseEntity<Chat> createGroup(@ModelAttribute CreateGroupRequest request) throws IOException {
        byte[] image = request.getImage() != null ? request.getImage().getBytes() : null;
        Chat chat = groupService.createGroup(
                request.getName(),
                request.getDescription(),
                image,
                request.getParticipantIds(),
                getCurrentUserId()
        );
        return ResponseEntity.ok(chat);
    }

    @PutMapping("/{chatId}")
    public ResponseEntity<Chat> updateGroup(@PathVariable UUID chatId,
                                            @ModelAttribute UpdateGroupRequest request) throws IOException {
        byte[] image = request.getImage() != null ? request.getImage().getBytes() : null;
        Chat chat = groupService.updateGroup(chatId, request.getName(), request.getDescription(), image, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(chat);
    }

    @GetMapping("/{chatId}/members")
    public ResponseEntity<List<GroupMemberDto>> getMembers(@PathVariable UUID chatId) {
        return ResponseEntity.ok(groupService.getMembers(chatId));
    }

    @PostMapping("/{chatId}/members")
    public ResponseEntity<Chat> addMembers(@PathVariable UUID chatId,
                                           @RequestBody List<UUID> userIds) {
        return ResponseEntity.ok(groupService.addMembers(chatId, userIds, SecurityUtils.getCurrentUserId()));
    }

    @DeleteMapping("/{chatId}/members/{userId}")
    public ResponseEntity<Chat> removeMember(@PathVariable UUID chatId,
                                             @PathVariable UUID userId) {
        return ResponseEntity.ok(groupService.removeMember(chatId, userId, SecurityUtils.getCurrentUserId()));
    }

    @PatchMapping("/{chatId}/members/{userId}/role")
    public ResponseEntity<Void> updateMemberRole(@PathVariable UUID chatId,
                                                 @PathVariable UUID userId,
                                                 @RequestBody String role) {
        groupService.updateMemberRole(chatId, userId, GroupRole.valueOf(role), SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{chatId}/invite")
    public ResponseEntity<InviteLinkResponse> generateInvite(@PathVariable UUID chatId) {
        String token = jwtService.generateGroupInviteToken(chatId);
        return ResponseEntity.ok(new InviteLinkResponse("/join?token=" + token));
    }

    @PostMapping("/join")
    public ResponseEntity<Chat> joinGroup(@RequestParam String token) {
        Chat chat = groupService.joinGroupWithJwtToken(token);
        return ResponseEntity.ok(chat);
    }
}