package com.ftn.sr192024.messenger.repository;

import com.ftn.sr192024.messenger.models.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsernameAndRegisteredIsTrue(String username);

    @Query("SELECT u FROM User u WHERE u.id != :currentUserId " +
            "AND (:searchQuery IS NULL OR " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :searchQuery, '%')) OR " +
            "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchQuery, '%')) OR " +
            "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchQuery, '%')) OR " +
            "u.phoneNumber LIKE CONCAT('%', :searchQuery, '%'))")
    Page<User> searchUsers(
            @Param("currentUserId") UUID currentUserId,
            @Param("searchQuery") String searchQuery,
            Pageable pageable
    );

    @Modifying
    @Query("UPDATE User u SET u.passwordHash = :password WHERE u.id = :userId")
    void updatePassword(@Param("password") String password,@Param("userId") UUID userId);

    Optional<User> findUserByIdAndRegisteredIsTrue(UUID id);

    Optional<List<User>> findByIdInAndRegistered(Collection<UUID> id, boolean registered);
}
