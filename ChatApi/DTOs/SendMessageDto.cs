namespace ChatApi.DTOs
{
    public class SendMessageDto
    {
        public string Content { get; set; }
        public string? ReceiverId { get; set; }
        public int? ChatGroupId { get; set; }
    }
}
