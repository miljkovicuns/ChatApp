// repository/GroupMembershipRepository.java
package com.ftn.sr192024.messenger.repository;

import com.ftn.sr192024.messenger.models.GroupMembership;
import com.ftn.sr192024.messenger.models.GroupRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupMembershipRepository extends JpaRepository<GroupMembership, UUID> {
    List<GroupMembership> findByChatId(UUID chatId);

    Optional<GroupMembership> findByUserIdAndChatId(UUID userId, UUID chatId);

    boolean existsByUserIdAndChatId(UUID userId, UUID chatId);

    @Modifying
    @Query("DELETE FROM GroupMembership gm WHERE gm.chat.id = :chatId AND gm.user.id = :userId")
    void deleteByChatIdAndUserId(@Param("chatId") UUID chatId, @Param("userId") UUID userId);

    @Query("SELECT gm.role FROM GroupMembership gm WHERE gm.user.id = :userId AND gm.chat.id = :chatId")
    Optional<GroupRole> findRoleByUserIdAndChatId(@Param("userId") UUID userId, @Param("chatId") UUID chatId);
}