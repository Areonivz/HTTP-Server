#include <iostream>
#include <netinet/in.h>
#include <sys/socket.h>
#include <fstream>
#include <unistd.h>
#include <sstream>


std::string LoadFile(const std::string& FilePath){
    std::ifstream file(FilePath);
    if (!file.is_open())
    {
        return "";
    }

    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

std::string buildHTTPResponse(const std::string& content_type, const std::string& body){
    std::stringstream response;
    response << "HTTP/1.1 200 OK\r\n";
    response << "Content-Type: " << content_type << "\r\n";
    response << "Content-Length: " << body.size() << "\r\n";
    response << "\r\n";
    response << body;
    
    return response.str();
}

void handleRequest(const int& clientSocket){
    char memBuffer[4096];
    int recievedBytes = recv(clientSocket, memBuffer, sizeof(memBuffer) - 1, 0);

    if (recievedBytes < 0) {std::cout<< "Trouble Recieving REQUEST" << std::endl; return;}

    memBuffer[recievedBytes] = '\0';
    std::string request(memBuffer);

    std::stringstream requestStream(request);
    std::string method;
    std::string path;

    requestStream >> method >> path;

    if (method == "GET"){
        if (path == "/" || path == "/index.html")
        {
            std::string body = LoadFile("index.html");
            std::string response = buildHTTPResponse("text/html", body);
            send(clientSocket, response.c_str(), response.size(),0);
        }else if (path == "/styles.css")
        {
            std::string body = LoadFile("styles.css");
            std::string response = buildHTTPResponse("text/css", body);
            send(clientSocket, response.c_str(), response.size(), 0);
        }else if(path == "/script.js")
        {
            std::string body = LoadFile("script.js");
            std::string response = buildHTTPResponse("application/js", body);
            send(clientSocket, response.c_str(), response.size(), 0);
        }
        
    }else if(method == "POST")
    {
        std::string post_request = memBuffer;
        std::cout << post_request << std::endl;
        std::string response = buildHTTPResponse("text/plain", "RECIEVED POST DATA");
        send(clientSocket, response.c_str(), response.size(), 0);
    }
    

}

int main(){

    int serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSocket < 0)
    {
        std::cerr << "Failed to create socket" << std::endl;
        return 1;
    }

    int yes=1;
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));

    sockaddr_in serverAddress = {
        .sin_family = AF_INET,
        .sin_port = htons(8080),
        .sin_addr.s_addr = INADDR_ANY
    };

    if(bind(serverSocket, (struct sockaddr*)&serverAddress, sizeof(serverAddress)) < 0){
        std::cerr << "Bind Failed" << std::endl;
        return 1;
    }

    if(listen(serverSocket, 5) < 0){
        std::cerr << "Listen Failed" << std::endl;
        return 1;
    }

    while (true)
    {
        sockaddr_in clientAddress;
        socklen_t clientAddressLength = sizeof(clientAddress);
        int acceptedFD = accept(serverSocket, (struct sockaddr*)&clientAddress, &clientAddressLength);

        if (acceptedFD < 0){
            std::cerr << "Accepting Client Failed" << std::endl;
            return 1;
        }

        handleRequest(acceptedFD);
        close(acceptedFD);
    }
    
    close(serverSocket);
}