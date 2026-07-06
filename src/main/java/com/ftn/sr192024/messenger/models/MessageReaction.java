package com.ftn.sr192024.messenger.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "message_reactions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"message_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageReaction {
     @Id
     @GeneratedValue(strategy = GenerationType.UUID)
     private UUID id;

     @ManyToOne
     @JoinColumn(name = "message_id", nullable = false)
     private Message message;

     @ManyToOne
     @JoinColumn(name = "user_id", nullable = false)
     private User user;

     @Enumerated(EnumType.STRING)
     private ReactionType reactionType;
}

