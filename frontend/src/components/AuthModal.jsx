import { useState } from "react"
import { useNavigate } from "react-router-dom"

import api from "@/api/axios"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/useAuth"

const initialForm = {
    name: "",
    email: "",
    password: "",
}

function AuthModal() {
    const {
        authMode,
        authMessage,
        authVersion,
        closeAuthModal,
    } = useAuth()

    const isRegister = authMode === "register"

    const handleOpenChange = (open) => {
        if (!open) {
            closeAuthModal()
        }
    }

    return (
        <Dialog open={Boolean(authMode)} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isRegister ? "Create Account" : "Sign In"}</DialogTitle>
                    <DialogDescription>
                        {authMessage || (isRegister ? "Create an account to continue." : "Sign in to continue.")}
                    </DialogDescription>
                </DialogHeader>

                <AuthForm key={authVersion} authMode={authMode} />
            </DialogContent>
        </Dialog>
    )
}

function AuthForm({ authMode }) {
    const {
        completeAuth,
        switchAuthMode,
    } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState(initialForm)
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [fieldsLocked, setFieldsLocked] = useState(true)
    const [fieldSuffix] = useState(() => `${authMode || "auth"}-${Date.now()}`)

    const isRegister = authMode === "register"
    const nameFieldId = `auth-name-${fieldSuffix}`
    const emailFieldId = `auth-email-${fieldSuffix}`
    const passwordFieldId = `auth-password-${fieldSuffix}`

    const handleChange = (field, value) => {
        setForm({
            ...form,
            [field]: value,
        })
    }

    const unlockFields = () => {
        setFieldsLocked(false)
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError("")
        setIsSubmitting(true)

        try {
            const endpoint = isRegister ? "/auth/register" : "/auth/login"
            const payload = isRegister
                ? form
                : { email: form.email, password: form.password }
            const res = await api.post(endpoint, payload)

            if (!res.data.user || !res.data.token) {
                switchAuthMode("login")
                return
            }

            const onSuccess = completeAuth(res.data.user, res.data.token)

            if (onSuccess) {
                await onSuccess()
                return
            }

            navigate(res.data.user.role === "admin" ? "/admin" : "/events")
        } catch (submitError) {
            setError(submitError.response?.data?.message || "Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleModeSwitch = (mode) => {
        switchAuthMode(mode)
    }

    return (
        <>
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="new-password">
                    <input
                        className="hidden"
                        tabIndex={-1}
                        autoComplete="username"
                        name="username"
                        readOnly
                    />
                    <input
                        className="hidden"
                        tabIndex={-1}
                        autoComplete="current-password"
                        name="password"
                        type="password"
                        readOnly
                    />
                    {isRegister && (
                        <div className="space-y-2">
                            <Label htmlFor={nameFieldId}>Name</Label>
                            <Input
                                id={nameFieldId}
                                name={`display-name-${fieldSuffix}`}
                                placeholder="Your name"
                                value={form.name}
                                onFocus={unlockFields}
                                onChange={(event) => handleChange("name", event.target.value)}
                                autoComplete="off"
                                data-1p-ignore="true"
                                data-lpignore="true"
                                readOnly={fieldsLocked}
                                required
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor={emailFieldId}>Email</Label>
                        <Input
                            id={emailFieldId}
                            name={`contact-${fieldSuffix}`}
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onFocus={unlockFields}
                            onChange={(event) => handleChange("email", event.target.value)}
                            autoComplete="new-password"
                            data-1p-ignore="true"
                            data-lpignore="true"
                            readOnly={fieldsLocked}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={passwordFieldId}>Password</Label>
                        <Input
                            id={passwordFieldId}
                            name={`secret-${fieldSuffix}`}
                            type="password"
                            placeholder="Password"
                            value={form.password}
                            onFocus={unlockFields}
                            onChange={(event) => handleChange("password", event.target.value)}
                            autoComplete="new-password"
                            data-1p-ignore="true"
                            data-lpignore="true"
                            readOnly={fieldsLocked}
                            required
                        />
                    </div>

                    {error && (
                        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting
                            ? "Please wait..."
                            : isRegister
                                ? "Create Account"
                                : "Sign In"}
                    </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    {isRegister ? (
                        <>
                            Already have an account?{" "}
                            <button
                                type="button"
                                className="font-medium text-primary hover:underline"
                                onClick={() => handleModeSwitch("login")}
                            >
                                Sign In
                            </button>
                        </>
                    ) : (
                        <>
                            New here?{" "}
                            <button
                                type="button"
                                className="font-medium text-primary hover:underline"
                                onClick={() => handleModeSwitch("register")}
                            >
                                Create new account
                            </button>
                        </>
                    )}
                </div>
        </>
    )
}

export default AuthModal
