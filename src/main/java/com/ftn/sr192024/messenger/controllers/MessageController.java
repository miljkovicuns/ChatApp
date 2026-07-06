package com.ftn.sr192024.messenger.controllers;

import com.ftn.sr192024.messenger.services.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;

    // ------------------- SEARCH ENDPOINT -------------------

}
