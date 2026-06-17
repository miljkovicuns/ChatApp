package com.ftn.sr192024.messenger.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(name = "date_of_sending", nullable = false)
    private LocalDateTime dateOfSending;

    @ManyToOne
    @JoinColumn(name = "sender", nullable = false)
    private User sender;

    @ManyToOne
    @JoinColumn(name = "reply_to_message_id")
    private Message replyTo;

    @OneToMany(mappedBy = "message")
    private List<MessageReaction> reactions;

    @ManyToOne
    @JoinColumn(name = "forwarded_from_message_id")
    private Message forwardedFrom;

    @ManyToOne(optional = false)
    @JoinColumn(name = "chat_id")
    private Chat chat;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<MessageReadStatus> readStatuses = new ArrayList<>();

    // Helper method to check if a user has read this message
    @Transient
    public boolean isReadByUser(UUID userId) {
        return readStatuses.stream()
                .anyMatch(status -> status.getUser().getId().equals(userId));
    }
}
