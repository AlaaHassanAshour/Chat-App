﻿namespace ChatApi.DTOs
{
    public class MessageDto
    {
        public string Content { get; set; }
        public string SenderId { get; set; }
        public string ReceiverId { get; set; }
        public int? ChatGroupId { get; set; }
    }
}
