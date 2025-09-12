package com.example.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.HashMap;
import java.util.Map;

@Data
@AllArgsConstructor
public class UserInfoResponse {
    private Long id;
    private String email;
    private String name;
    private String pictureUrl;
    private String status;

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("email", email);
        map.put("name", name);
        map.put("pictureUrl", pictureUrl);
        map.put("status", status);
        return map;
    }
} 