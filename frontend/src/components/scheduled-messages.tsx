import { useState, useEffect } from 'react';
import { Trash2, Calendar, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { apiService, type ScheduledMessage } from '@/lib/api';
import { toast } from 'sonner';

export function ScheduledMessages() {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchMessages = async () => {
    try {
      const data = await apiService.getScheduledMessages();
      setMessages(data);
    } catch (error) {
      toast.error('Failed to fetch scheduled messages');
      console.error('Fetch messages error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await apiService.cancelMessage(id);
      toast.success('Message cancelled successfully');
      await fetchMessages(); // Refresh the list
    } catch (error) {
      toast.error('Failed to cancel message');
      console.error('Cancel message error:', error);
    } finally {
      setCancellingId(null);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchMessages();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Messages
            </CardTitle>
            <CardDescription>
              Manage your scheduled notifications
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No scheduled messages found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className="flex items-start justify-between p-4 border rounded-lg bg-card"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={message.status === 'active' ? 'default' : 'secondary'}>
                      {message.status}
                    </Badge>
                    {message.loop_daily && (
                      <Badge variant="outline">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Daily
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium break-words">
                    {message.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {message.send_time}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(message.start_date), 'MMM d, yyyy')}
                      {message.end_date && (
                        <span> - {format(new Date(message.end_date), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {message.status === 'active' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-4 text-destructive hover:text-destructive"
                        disabled={cancellingId === message.id}
                      >
                        {cancellingId === message.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Scheduled Message</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this scheduled message? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancel(message.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Cancel Message
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}