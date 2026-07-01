package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.Chat;
import com.ftn.sr192024.messenger.models.User;
import com.ftn.sr192024.messenger.repository.ChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final UserService userService;

    public List<Chat> getUsersChats(UUID userId) {
        return chatRepository.findByParticipantsId(userId);
    }

    public Chat createDirectChat(List<UUID> participantIds) throws IOException {
        if(participantIds.size() != 2){
            throw new RuntimeException("Direct chat must have exactly 2 participants");
        }

        List<User> users = userService.findAllByIds(participantIds);
        if(users.size() != 2){
            throw new RuntimeException("One or more users not found");
        }

        Chat existingChat = chatRepository.findDirectChatBetweenUsers(
                users.get(0).getId(),
                users.get(1).getId()
        ).orElse(null);

        if(existingChat != null){
            return existingChat;
        }

        Chat chat = new Chat();
        chat.setParticipants(users);
        chat.setGroupChat(false);
        chat.setDateCreated(LocalDateTime.now());

        return chatRepository.save(chat);
    }

    public Chat createGroupChat(String name, String description, List<UUID> participantIds) throws IOException {
        if(name == null || name.trim().isEmpty()){
            throw new RuntimeException("Group Name Is Required");
        }

        List<User> participants = userService.findAllByIds(participantIds);
        if(participants.size() != participantIds.size()){
            throw new RuntimeException("One or more users not found");
        }

        Chat chat = new Chat();
        chat.setGroupChat(true);
        chat.setName(name);
        chat.setDescription(description);
        chat.setParticipants(participants);
        chat.setDateCreated(LocalDateTime.now());

        return chatRepository.save(chat);
    }

    public Chat findById(UUID chatId) {
        return chatRepository.findById(chatId).orElse(null);
    }

    public void save(Chat chat) {
        chatRepository.save(chat);
    }
}
