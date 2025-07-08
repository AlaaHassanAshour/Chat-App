namespace ChatApi.DTOs
{
    public class CreateChatGroupDto
    {
        public string Name{ get; set; }
        public List<string> MemberIds { get; set; }

    }
}
