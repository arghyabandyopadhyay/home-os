// Home OS Notification Service Worker
// Handles Web Push notifications and notification click navigation.

// Push event — display browser notification from push payload
self.addEventListener("push", (event) => {
  const data = event.data?.json()

  if (!data) return

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: data.id, // prevent duplicate notifications
      data: { targetRoute: data.targetRoute },
    })
  )
})

// Notification click — focus existing app tab or open new window
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetRoute = event.notification.data?.targetRoute

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      // Find an existing app tab (exclude login page)
      const existingClient = windowClients.find(
        (client) => !client.url.includes("/login")
      )

      if (existingClient) {
        existingClient.focus()
        existingClient.navigate(targetRoute || "/dashboard")
      } else {
        clients.openWindow(targetRoute || "/dashboard")
      }
    })
  )
})
