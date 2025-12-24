package com.lab10.javabackend.service;

import com.lab10.javabackend.model.User;
import com.lab10.javabackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll(PageRequest.of(0, 10)).getContent();
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public long getUserCount() {
        return userRepository.count();
    }
}