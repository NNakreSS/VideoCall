local users = {}
RegisterServerEvent("nakres_videocall:sendData")
AddEventHandler("nakres_videocall:sendData", function(data)
    local user = findUser(data.callId)

    -- print(json.encode(user))
    if data.type == "store_user" then
        if user ~= nil then
            return
        end
        local newUser = {
            serverId = data.serverId,
            callId = data.callId
        }
        table.insert(users, newUser)
        -- print(json.encode(newUser))
        -- user = newUser
        -- print(newUser.callId .. " Eklendi")

    elseif data.type == "store_offer" then
        if user == nil then
            return
        end
        user.offer = data.offer
        -- print(json.encode(user.offer))

    elseif data.type == "store_candidate" then
        -- print(user.serverId)
        if user == nil then
            return
        end
        if user.candidates == nil then
            user.candidates = {}
        end
        table.insert(user.candidates, data.candidate)
        -- print(json.encode(data.candidate))

    elseif data.type == "send_answer" then
        if user == nil then
            return
        end
        sendData({
            type = "answer",
            answer = data.answer
        }, user.serverId)

    elseif data.type == "send_candidate" then
        if user == nil then
            return
        end
        sendData({
            type = "candidate",
            candidate = data.candidate
        }, user.serverId)

    elseif data.type == "join_call" then
        -- print(user.offer)
        if user == nil then
            return
        end
        sendData({
            type = "offer",
            offer = user.offer
        }, user.callId)
        -- print(json.encode(user.candidates))
        for index, value in ipairs(user.candidates) do
            sendData({
                type = "candidate",
                candidate = value
            }, user.callId)
            -- print("join")
        end

    end
end)

function sendData(data, src)
    TriggerClientEvent("nakres_videocall:sendData", src, data)
end

function findUser(callId)
    for i, user in ipairs(users) do
        if user.callId == callId then
            return user
        end
    end
end

RegisterServerEvent("nakres_videocall:sendCall")
AddEventHandler("nakres_videocall:sendCall", function(id)
    TriggerClientEvent("nakres_videocall:sendCall", id)
end)
