package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.models.Chat;
import com.ftn.sr192024.messenger.models.dto.GroupChatRequest;
import com.ftn.sr192024.messenger.repository.ChatRepository;
import com.ftn.sr192024.messenger.services.ChatService;
import lombok.AllArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.ftn.sr192024.messenger.security.SecurityUtils.getCurrentUserId;

@Controller
@RequestMapping("/api/chats")
@AllArgsConstructor
public class ChatController {

    private ChatService chatService;

    @GetMapping("/my-chats")
    public ResponseEntity<List<Chat>> getMyChats() {
        UUID id = getCurrentUserId();

        ArrayList<Chat> myChats = chatService.getUsersChat(id);
        return ResponseEntity.ok(myChats);
    }

    @PostMapping("/direct")
    public ResponseEntity<Chat> createDirectChat(@RequestBody Map<String, List<UUID>> request) {
        List<UUID> participantIds = request.get("participantIds");
        Chat chat = chatService.createDirectChat(participantIds);
        return ResponseEntity.ok(chat);
    }

    @PostMapping("/group")
    public ResponseEntity<Chat> createGroupChat(@RequestBody GroupChatRequest request) {
        Chat chat = chatService.createGroupChat(
                request.getName(),
                request.getDescription(),
                request.getParticipantIds()
        );
        return ResponseEntity.ok(chat);
    }
}
