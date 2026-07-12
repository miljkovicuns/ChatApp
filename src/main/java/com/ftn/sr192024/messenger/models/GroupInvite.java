// models/GroupInvite.java
package com.ftn.sr192024.messenger.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "group_invites")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class GroupInvite {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String token;

    @Column(name = "chat_id", nullable = false)
    private UUID chatId;

    @Column(nullable = false)
    private LocalDateTime expiry;

    private boolean used = false;
}