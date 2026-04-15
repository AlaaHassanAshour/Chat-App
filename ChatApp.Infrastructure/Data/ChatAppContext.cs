using ChatApp.Application.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Data;

public class ChatAppContext : IdentityDbContext<AppUser>
{
    public ChatAppContext(DbContextOptions<ChatAppContext> options) : base(options) { }

    public DbSet<Message> Messages { get; set; }
    public DbSet<ChatGroup> ChatGroups { get; set; }
    public DbSet<ChatGroupUser> ChatGroupUsers { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ChatGroupUser>()
            .HasKey(cg => new { cg.ChatGroupId, cg.UserId });

        builder.Entity<ChatGroupUser>()
            .HasOne(cg => cg.User)
            .WithMany(u => u.ChatGroups)
            .HasForeignKey(cg => cg.UserId);

        builder.Entity<ChatGroupUser>()
            .HasOne(cg => cg.ChatGroup)
            .WithMany(g => g.Members)
            .HasForeignKey(cg => cg.ChatGroupId);

        builder.Entity<Message>()
            .HasOne(m => m.ChatGroup)
            .WithMany(g => g.Messages)
            .HasForeignKey(m => m.ChatGroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany(u => u.SentMessages)
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Message>()
            .HasOne(m => m.Receiver)
            .WithMany(u => u.ReceivedMessages)
            .HasForeignKey(m => m.ReceiverId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RefreshToken>()
            .HasOne(rt => rt.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
