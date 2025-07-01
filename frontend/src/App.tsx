import { Bell } from 'lucide-react';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { SendNowSection } from '@/components/send-now-section';
import { ScheduleForm } from '@/components/schedule-form';
import { ScheduledMessages } from '@/components/scheduled-messages';
import { MessageHistory } from '@/components/message-history';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="fcm-dashboard-theme">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">FCM Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage Firebase Cloud Messaging notifications
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-8">
            {/* Top Row - Send Now and Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SendNowSection />
              <ScheduleForm />
            </div>

            {/* Bottom Row - Scheduled Messages and History */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ScheduledMessages />
              <MessageHistory />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 mt-16">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>FCM Notification Dashboard - Built with React, Vite, and shadcn/ui</p>
            </div>
          </div>
        </footer>

        <Toaster position="top-right" richColors />
      </div>
    </ThemeProvider>
  );
}

export default App;