package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.Message;
import com.ftn.sr192024.messenger.models.dto.SendMessageDto;
import com.ftn.sr192024.messenger.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final ChatService chatService;
    private final UserService userService;

    public List<Message> findByChatId(UUID chatID) {
        return messageRepository.findByChatId(chatID).orElse(null);
    }

    public Message sendMessage(SendMessageDto sendMessageDto) {
        Message message = new Message();
        message.setChat(chatService.findById(sendMessageDto.getChatId()));
        message.setSender(userService.findById(sendMessageDto.getSenderId()));
        message.setContent(sendMessageDto.getContent());
        message.setDateOfSending(LocalDateTime.now());
        messageRepository.save(message);
        return message;
    }
}
