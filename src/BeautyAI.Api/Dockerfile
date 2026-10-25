FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src
COPY src/BeautyAI.Domain/BeautyAI.Domain.csproj src/BeautyAI.Domain/
COPY src/BeautyAI.Application/BeautyAI.Application.csproj src/BeautyAI.Application/
COPY src/BeautyAI.Infrastructure/BeautyAI.Infrastructure.csproj src/BeautyAI.Infrastructure/
COPY src/BeautyAI.Api/BeautyAI.Api.csproj src/BeautyAI.Api/
RUN dotnet restore src/BeautyAI.Api/BeautyAI.Api.csproj
COPY src/ src/
RUN dotnet publish src/BeautyAI.Api/BeautyAI.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
USER app
ENTRYPOINT ["dotnet", "BeautyAI.Api.dll"]
