package com.ftn.sr192024.messenger.models.dto;

import com.ftn.sr192024.messenger.models.MessageReaction;
import com.ftn.sr192024.messenger.models.ReactionType;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
@Setter
public class ReactionResponseDto {
    private UUID id;
    private UUID userId;
    private String username;
    private ReactionType reactionType;

    public static ReactionResponseDto fromEntity(MessageReaction reaction) {
        ReactionResponseDto dto = new ReactionResponseDto();
        dto.setId(reaction.getId());
        dto.setReactionType(reaction.getReactionType());
        if (reaction.getUser() != null) {
            dto.setUserId(reaction.getUser().getId());
            dto.setUsername(reaction.getUser().getUsername());
        }
        return dto;
    }

    public static List<ReactionResponseDto> fromEntities(List<MessageReaction> reactions) {
        if (reactions == null) {
            return List.of();
        }
        return reactions.stream()
                .map(ReactionResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
}
