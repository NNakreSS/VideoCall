local openUi = false
RegisterCommand("görüntülü", function()
    if not openUi then
        openUi = true
        SetNuiFocus(true, true)
        SendNUIMessage({
            type = "open",
            serverId = GetPlayerServerId(PlayerId())
        })
    else
        openUi = false
        SetNuiFocus(false, false)
        SendNUIMessage({
            type = "close"
        })
    end
end)

RegisterNUICallback("addStartCall", function()
    local frontCam = true
    Called = true
    CreateMobilePhone(4)
    CellCamActivate(true, true)
    selfie(frontCam)
    while Called do
        Citizen.Wait(100)
        HideHudComponentThisFrame(7)
        HideHudComponentThisFrame(8)
        HideHudComponentThisFrame(9)
        HideHudComponentThisFrame(6)
        HideHudComponentThisFrame(19)
        HideHudAndRadarThisFrame()
        if IsControlJustPressed(1, 27) then
            frontCam = not frontCam
            selfie(frontCam)
        elseif IsControlJustPressed(1, 177) then
            CellCamActivate(false, false)
            DestroyMobilePhone()
            Called = false
        end
    end
end)

function selfie(boolean)
    Citizen.InvokeNative(0x2491A93618B7D838, boolean) -- Selfie modu
end

RegisterNUICallback("startCallId", function(data)
    TriggerServerEvent("nakres_videocall:sendCall", data.id)
end)

RegisterNetEvent("nakres_videocall:sendCall")
AddEventHandler("nakres_videocall:sendCall", function(id)
    SendNUIMessage({
        type = "answer",
        serverId = id
    })
end)

RegisterNUICallback("sendData", function(data)
    print(data.type)
    TriggerServerEvent("nakres_videocall:sendData", data)
end)

RegisterNetEvent("nakres_videocall:sendData")
AddEventHandler("nakres_videocall:sendData", function(data)
    SendNUIMessage({
        data = data,
        type = "sendData"
    })
end)
