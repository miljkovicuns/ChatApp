package com.ftn.sr192024.messenger.services;

import com.ftn.sr192024.messenger.models.Message;
import com.ftn.sr192024.messenger.models.MessageReaction;
import com.ftn.sr192024.messenger.models.ReactionType;
import com.ftn.sr192024.messenger.models.User;
import com.ftn.sr192024.messenger.models.dto.ReactionResponseDto;
import com.ftn.sr192024.messenger.repository.MessageReactionRepository;
import com.ftn.sr192024.messenger.repository.MessageRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReactionService {
    private final MessageReactionRepository reactionRepository;
    private final MessageRepository messageRepository;
    private final UserService userService;

    public List<ReactionResponseDto> getReactionsForMessage(UUID messageId) {
        return ReactionResponseDto.fromEntities(reactionRepository.findByMessageId(messageId));
    }

    @Transactional
    public List<ReactionResponseDto> toggleReaction(UUID messageId, UUID userId, ReactionType reactionType) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        var existing = reactionRepository.findByMessageIdAndUserId(messageId, userId);

        if (existing.isPresent()) {
            MessageReaction reaction = existing.get();
            if (reaction.getReactionType() == reactionType) {
                reactionRepository.delete(reaction);
            } else {
                reaction.setReactionType(reactionType);
                reactionRepository.save(reaction);
            }
        } else {
            MessageReaction reaction = new MessageReaction();
            reaction.setMessage(message);
            reaction.setUser(user);
            reaction.setReactionType(reactionType);
            reactionRepository.save(reaction);
        }

        return ReactionResponseDto.fromEntities(reactionRepository.findByMessageId(messageId));
    }
}
