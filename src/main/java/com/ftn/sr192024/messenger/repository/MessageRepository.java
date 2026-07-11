package com.ftn.sr192024.messenger.repository;

import com.ftn.sr192024.messenger.models.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    Optional<List<Message>> findByChatIdOrderByDateOfSendingAsc(UUID chat_id);
    @Query(value = "SELECT * FROM messages m " +
            "WHERE m.chat_id = :chatId " +
            "AND (:keyword IS NULL OR :keyword = '' OR MATCH(m.content) AGAINST(:keyword IN NATURAL LANGUAGE MODE)) " +
            "AND (:startDate IS NULL OR m.date_of_sending >= :startDate) " +
            "AND (:endDate IS NULL OR m.date_of_sending <= :endDate)",
            countQuery = "SELECT COUNT(*) FROM messages m " +
                    "WHERE m.chat_id = :chatId " +
                    "AND (:keyword IS NULL OR :keyword = '' OR MATCH(m.content) AGAINST(:keyword IN NATURAL LANGUAGE MODE)) " +
                    "AND (:startDate IS NULL OR m.date_of_sending >= :startDate) " +
                    "AND (:endDate IS NULL OR m.date_of_sending <= :endDate)",
            nativeQuery = true)
    Page<Message> searchMessagesInChat(
            @Param("chatId") UUID chatId,
            @Param("keyword") String keyword,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT m FROM Message m " +
            "WHERE m.chat.id = :chatId " +
            "AND (:keyword IS NULL OR :keyword = '' OR LOWER(m.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:startDate IS NULL OR m.dateOfSending >= :startDate) " +
            "AND (:endDate IS NULL OR m.dateOfSending <= :endDate)")
    Page<Message> searchMessagesInChatFallback(
            @Param("chatId") UUID chatId,
            @Param("keyword") String keyword,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("SELECT COUNT(DISTINCT m.sender.id) FROM Message m WHERE m.dateOfSending BETWEEN :start AND :end")
    long countDistinctSendersInPeriod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.dateOfSending BETWEEN :start AND :end")
    long countByDateOfSendingBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Top users
    @Query(value = "SELECT u.id, u.username, u.first_name, u.last_name, COUNT(m.id) as cnt " +
            "FROM users u JOIN messages m ON u.id = m.sender " +
            "WHERE m.date_of_sending BETWEEN :start AND :end " +
            "GROUP BY u.id, u.username, u.first_name, u.last_name " +
            "ORDER BY cnt DESC LIMIT :limit", nativeQuery = true)
    List<Object[]> findTopUsersByMessageCount(@Param("start") LocalDateTime start,
                                              @Param("end") LocalDateTime end,
                                              @Param("limit") int limit);

    // Top groups (only group chats)
    @Query(value = "SELECT c.id, c.name, COUNT(m.id) as cnt " +
            "FROM chat c JOIN messages m ON c.id = m.chat_id " +
            "WHERE c.group_chat = true AND m.date_of_sending BETWEEN :start AND :end " +
            "GROUP BY c.id, c.name " +
            "ORDER BY cnt DESC LIMIT :limit", nativeQuery = true)
    List<Object[]> findTopGroupsByMessageCount(@Param("start") LocalDateTime start,
                                               @Param("end") LocalDateTime end,
                                               @Param("limit") int limit);

    @Query(value = "SELECT DATE_FORMAT(m.date_of_sending, :dateFormat) as period, COUNT(m.id) as cnt " +
            "FROM messages m WHERE m.date_of_sending BETWEEN :start AND :end " +
            "GROUP BY period ORDER BY period", nativeQuery = true)
    List<Object[]> countMessagesGroupedByPeriod(@Param("start") LocalDateTime start,
                                                @Param("end") LocalDateTime end,
                                                @Param("dateFormat") String dateFormat);

    @Query(value = "SELECT DATE_FORMAT(m.date_of_sending, :dateFormat) as period, COUNT(DISTINCT m.sender) as cnt " +
            "FROM messages m WHERE m.date_of_sending BETWEEN :start AND :end " +
            "GROUP BY period ORDER BY period", nativeQuery = true)
    List<Object[]> countActiveUsersGroupedByPeriod(@Param("start") LocalDateTime start,
                                                   @Param("end") LocalDateTime end,
                                                   @Param("dateFormat") String dateFormat);
}
