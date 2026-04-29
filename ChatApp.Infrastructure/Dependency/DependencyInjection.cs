using ChatApp.Application.Interfaces;
using ChatApp.Infrastructure.Data;
using ChatApp.Infrastructure.Repositories;
using ChatApp.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ChatApp.Infrastructure.Dependency;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<ChatAppContext>(options =>
            options.UseSqlServer(config.GetConnectionString("ChatDatabase")));

        services.AddScoped<IMessageRepository, MessageRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IChatGroupRepository, ChatGroupRepository>();
        services.AddScoped<IChatGroupUserRepository, ChatGroupUserRepository>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IMessageService, ChatApp.Application.Services.MessageService>();
        services.AddScoped<INotificationService, ChatApp.Application.Services.NotificationService>();

        return services;
    }
}