#include <iostream>
#include <netinet/in.h>
#include <sys/socket.h>
#include <fstream>
#include <unistd.h>
#include <sstream>

int main(){
    //create socket
    int ServerSocket = socket(AF_INET, SOCK_STREAM, 0);

    //defining server address
    sockaddr_in ClientAddress;
    sockaddr_in ServerAddress = {
        .sin_family = AF_INET,
        .sin_port = htons(8080),
        .sin_addr.s_addr = INADDR_ANY
    };

    //bind the socket 
    bind(ServerSocket, (struct sockaddr*)&ServerAddress, sizeof(ServerAddress));

    //listening for incoming connections
    listen(ServerSocket, 5);

    socklen_t ClientAddressLength = sizeof(ClientAddress);
    char memBuffer[4098];
    
    //hmtl
    std::string html_body;
    std::ifstream readHTMLfile("index.html");
    std::stringstream htmlBuffer;
    htmlBuffer << readHTMLfile.rdbuf();
    html_body = htmlBuffer.str();
    std::string html_http_response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n";
    html_http_response += html_body;

    //css
    std::string css_body;
    std::ifstream readCSSfile("styles.css");
    std::stringstream cssBuffer;
    cssBuffer << readCSSfile.rdbuf();
    css_body = cssBuffer.str();
    std::string css_http_response = "HTTP/1.1 200 OK\r\nContent-Type: text/css\r\n\r\n";
    css_http_response += css_body;

    std::string js_body;
    std::ifstream readJSfile("script.js");
    std::stringstream jsBuffer;
    jsBuffer << readJSfile.rdbuf();
    js_body = jsBuffer.str();
    std::string js_http_response = "HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\n\r\n";
    js_http_response += js_body;


    while (true)
    {
        int newSockFd = accept(ServerSocket, (struct sockaddr*)&ClientAddress, &ClientAddressLength);
        int n = recv(newSockFd, memBuffer, 4098, 0);

        if (n > 0)
            memBuffer[n] = '\0';

        std::string http_request = memBuffer;

        std::stringstream requestStream(http_request);
        std::string method;
        std::string path;

        requestStream >> method >> path;

        if (method == "POST"){
            std::cout << http_request << std::endl;
            std::string post_http_response = "HTTP/1.1 200 OK\r\nContent-Type: text/text\r\n\r\n";
            post_http_response += "RECEIVED POSTED DATA";
            send(newSockFd, post_http_response.c_str(), post_http_response.size(), 0);
        }else if (method == "GET")
        {
            if(path == "/" || path=="/index.html" ){
 
                int bytesSent = send(newSockFd, html_http_response.c_str(), html_http_response.size(), 0);
            }
            else if (path == "/styles.css")
            {
                int bytesSent = send(newSockFd, css_http_response.c_str(), css_http_response.size(), 0);
            }
            else if (path == "/script.js")
            {
                int bytesSent = send(newSockFd, js_http_response.c_str(), js_http_response.size(), 0);
            } else if (path == "/data")
            {
                std::string data = "{'key1':'value1', 'key2':'value2'}";
                int bytesSent = send(newSockFd, data.c_str(), data.size(), 0);
            }
            
        
        }
        
        close(newSockFd);
    }
    close(ServerSocket);
    
}