package com.rentit.dto.messaging;

public class WsSendMessageRequest {
    private String conversationId;
    private String messageText;   // matches frontend JSON key exactly
    private String tempId;
    private String messageType;

    public WsSendMessageRequest() {}
    public String getConversationId()         { return conversationId; }
    public void   setConversationId(String v) { this.conversationId = v; }
    public String getMessageText()            { return messageText; }
    public void   setMessageText(String v)    { this.messageText = v; }
    public String getTempId()                 { return tempId; }
    public void   setTempId(String v)         { this.tempId = v; }
    public String getMessageType()            { return messageType; }
    public void   setMessageType(String v)    { this.messageType = v; }
}
