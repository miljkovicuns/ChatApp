// repository/GroupInviteRepository.java
package com.ftn.sr192024.messenger.repository;

import com.ftn.sr192024.messenger.models.GroupInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GroupInviteRepository extends JpaRepository<GroupInvite, UUID> {
    Optional<GroupInvite> findByToken(String token);
    void deleteByChatId(UUID chatId);
}