export function EmptyConversation() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 max-w-xs animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-inner">💬</div>
      <h3 className="text-lg font-bold text-foreground mb-2 tracking-tight">
        Select a conversation
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed font-medium">
        Choose a conversation from the left to start messaging. 
        Reach owners directly from any listing page.
      </p>
    </div>
  )
}

