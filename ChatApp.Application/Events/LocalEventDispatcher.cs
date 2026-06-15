using Microsoft.Extensions.DependencyInjection;

namespace ChatApp.Application.Events;

public class LocalEventDispatcher : ILocalEventDispatcher
{
    private readonly IServiceProvider _serviceProvider;

    public LocalEventDispatcher(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task PublishAsync<TEvent>(TEvent localEvent, CancellationToken cancellationToken = default)
        where TEvent : ILocalEvent
    {
        var handlers = _serviceProvider.GetServices<ILocalEventHandler<TEvent>>();

        foreach (var handler in handlers)
        {
            await handler.HandleAsync(localEvent, cancellationToken);
        }
    }
}
