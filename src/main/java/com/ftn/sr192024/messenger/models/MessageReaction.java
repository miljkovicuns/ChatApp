package com.ftn.sr192024.messenger.models;


import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "message_reactions")
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

