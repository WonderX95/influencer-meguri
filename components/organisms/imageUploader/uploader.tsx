"use client"

import { useState, useRef, useEffect } from "react"
import { ImageIcon, X, Trash2 } from "lucide-react"


interface ImageUploaderProps {
    file: File | null
    id: string
    removable: boolean
    onRemove?: () => void
    onSelect: (file: File | null) => void
}

export default function ImageUploader({ file, id, removable, onRemove, onSelect }: ImageUploaderProps) {
    const [image, setImage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setImage(e.target?.result as string)
            }
            reader.readAsDataURL(file)
            onSelect(file);
        } else {
            setImage(null)
            onSelect(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }, [file, onSelect])
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setImage(e.target?.result as string)
            }
            reader.readAsDataURL(file)
            onSelect(file);
        }
    }

    const handleRemoveImage = () => {
        setImage(null)
        onSelect(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="px-6 mobile:px-2 sp:w-full mobile:w-full bg-white rounded-lg">
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 pt-10 pb-4">
                <div className="text-center">
                    {image ? (
                        <div className="relative inline-block">
                            <img
                                src={image}
                                alt="Uploaded preview"
                                className="max-w-full max-h-64 rounded-lg"
                            />
                            <button
                                className="w-[40px] h-[40px] flex justify-center items-center rounded-full text-white bg-red-500 absolute top-2 right-2"
                                onClick={handleRemoveImage}
                                aria-label="Remove image"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <ImageIcon
                            onClick={triggerFileInput}
                            className="mx-auto h-12 w-12 text-gray-300 cursor-pointer"
                            aria-hidden="true"
                        />
                    )}
                    <div className="mt-4 flex flex-col items-center text-sm leading-6 text-gray-600">
                        <label
                            htmlFor={`image-upload-${id}`}
                            className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-dark"
                        >
                            <span>{image ? "Change image" : "Choose file"}</span>
                            <input
                                id={`image-upload-${id}`}
                                name={`image-upload-${id}`}
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                            />
                        </label>
                    </div>
                    <p className="text-xs leading-5 text-gray-600 mt-2">
                        PNG, JPG, GIF up to 10MB
                    </p>
                    {removable &&
                        (<button
                            onClick={onRemove}
                            className="flex items-center justify-center mx-auto p-2 rounded-[10px] mt-2 text-neutral-500 bg-neutral-300"><Trash2 /> remove</button>)
                    }
                </div>
            </div>
        </div>
    )
}