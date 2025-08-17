package com.email.writer.app;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EmailRequest {


    private String emailContent;
    private String  tone;

}
