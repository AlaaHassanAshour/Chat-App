using ChatApi.Models;

namespace ChatApi.DTOs
{
    public class SendMessageDto
    {
        public string Content { get; set; }
        public string? ReceiverId { get; set; }  // في حالة الرسائل الفردية
     
        public int? ChatGroupId { get; set; }   // في حالة الرسائل الجماعية
    }
}
