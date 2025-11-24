import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Notification, Timeframe } from '../types';
import { getNotificationDetails } from '../services/notificationService';

const NOTIFICATION_LIMIT = 50;

interface ToastNotificationProps {
  toast: Notification;
  onRemove: () => void;
  onClick?: () => void;
  isClickable: boolean;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onRemove, onClick, isClickable }) => {
    const [isVisible, setIsVisible] = useState(false);
    const removeRef = useRef(onRemove);
    removeRef.current = onRemove;

    useEffect(() => {
        const enterTimeout = requestAnimationFrame(() => setIsVisible(true));
        const exitTimer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => removeRef.current(), 500);
        }, 7000);

        return () => {
            cancelAnimationFrame(enterTimeout);
            clearTimeout(exitTimer);
        };
    }, [toast.id]);

    const handleClose = useCallback((e?: React.MouseEvent) => {
        if (e) e.stopPropagation(); // Prevent the main button click if the close icon is used
        setIsVisible(false);
        setTimeout(() => removeRef.current(), 500);
    }, []);

    const { icon, title, body, accentColor, iconColor } = getNotificationDetails(toast);
  
    return React.createElement(
        'button',
        {
            onClick: isClickable ? onClick : undefined,
            disabled: !isClickable,
            className: `transform transition-all duration-500 ease-in-out relative w-full max-w-sm p-3 overflow-hidden rounded-xl shadow-2xl bg-dark-bg/95 backdrop-blur-lg border border-dark-border/50 text-light-text text-left ${isClickable ? 'cursor-pointer' : 'cursor-default'} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`,
            role: 'alert',
            'aria-live': 'assertive'
        },
        React.createElement('div', { className: `absolute left-0 top-0 bottom-0 w-1.5 ${accentColor}` }),
        React.createElement(
            'div',
            { className: 'flex items-start pl-3' },
            React.createElement(
                'div',
                { className: 'flex-shrink-0 pt-0.5' },
                React.createElement('i', { className: `fa-solid ${icon} text-xl ${iconColor}` })
            ),
            React.createElement(
                'div',
                { className: 'ml-3 flex-1' },
                React.createElement('p', { className: 'text-sm font-bold' }, title),
                React.createElement('p', { className: 'mt-1 text-xs' }, body)
            ),
            React.createElement(
                'div',
                { className: 'ml-4 flex-shrink-0 flex' },
                React.createElement(
                    'button',
                    {
                        onClick: handleClose,
                        className: 'inline-flex text-medium-text hover:text-light-text focus:outline-none',
                        'aria-label': 'Close'
                    },
                    React.createElement('i', { className: 'fa-solid fa-xmark' })
                )
            )
        )
    );
};

export const ToastContainer: React.FC<{
  toast: Notification | null;
  onFinish: () => void;
  onClick?: (toast: Notification) => void;
}> = ({ toast, onFinish, onClick }) => {
    // FIX: Add 'N/A' to the list of non-clickable timeframes.
    const isClickable = toast ? !['5m', 'N/A'].includes(toast.timeframe) : false;
    
    return React.createElement(
        'div',
        { className: 'fixed top-2 md:top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 space-y-3' },
        toast ? React.createElement(ToastNotification, {
            key: toast.id,
            toast: toast,
            onRemove: onFinish,
            onClick: () => onClick && onClick(toast),
            isClickable: isClickable,
        }) : null
    );
};


const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        try {
            const saved = localStorage.getItem('notifications');
            // FIX: Add a guard to ensure that the parsed data from localStorage is an array.
            // This prevents runtime errors if the stored data is corrupted or not an array.
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });
    const [toastQueues, setToastQueues] = useState<Record<string, Notification[]>>({});
    const [activeToast, setActiveToast] = useState<Notification | null>(null);

    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);
    
    // Queue processing logic
    useEffect(() => {
        if (activeToast) return; // Don't process if a toast is already showing

        // Find the first available toast from any non-empty queue
        const allQueues = Object.entries(toastQueues);
        const firstQueueWithToasts = allQueues.find(([, queue]) => queue.length > 0);
        
        if (firstQueueWithToasts) {
            const [timeframe, queue] = firstQueueWithToasts;
            const [nextToast, ...remainingQueue] = queue;
            
            setActiveToast(nextToast);
            
            // Update the specific queue it was taken from
            setToastQueues(prevQueues => ({
                ...prevQueues,
                [timeframe]: remainingQueue,
            }));
        }
    }, [activeToast, toastQueues]);

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'timestamp'>, showToast: boolean = false) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now() + Math.random(),
            read: false,
            timestamp: Date.now(),
        };
        
        setNotifications(prev => [newNotification, ...prev].slice(0, NOTIFICATION_LIMIT));
        
        if (showToast) {
            setToastQueues(prevQueues => {
                const queueForTimeframe = prevQueues[newNotification.timeframe] || [];
                return {
                    ...prevQueues,
                    [newNotification.timeframe]: [...queueForTimeframe, newNotification],
                };
            });
        }
    }, []);

    const handleToastFinished = useCallback(() => {
        setActiveToast(null);
    }, []);
    
    const markNotificationsAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    return { notifications, activeToast, addNotification, handleToastFinished, markNotificationsAsRead, clearNotifications, ToastContainer };
};

export default useNotifications;