import { useState } from "react";
import Editor from "react-simple-wysiwyg";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CreateBlog = () => {
  const [html, setHtml] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  function onChange(e) {
    setHtml(e.target.value);
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size if needed
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, JPG, GIF)");
        e.target.value = null;
        return;
      }

      if (file.size > maxSize) {
        toast.error("File size should be less than 2MB");
        e.target.value = null;
        return;
      }

      setSelectedFile(file);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const formSubmit = async (data) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!selectedFile) {
        toast.error("Please select an image");
        return;
      }

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("author", data.author);
      formData.append("description", html);
      formData.append("shortDesc", data.shortDesc || "");
      formData.append("image", selectedFile);

      // Log the FormData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": ", pair[1]);
      }

      const res = await fetch("http://localhost:8000/api/blogs", {
        method: "POST",
        body: formData,
      });

      // Log the raw response for debugging
      const responseText = await res.text();
      console.log("Raw response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", responseText);
        throw new Error("Server returned invalid JSON response");
      }

      if (!res.ok) {
        throw new Error(result.message || "Failed to create blog");
      }

      if (!result.status) {
        if (result.errors) {
          Object.keys(result.errors).forEach((key) => {
            toast.error(result.errors[key][0]);
          });
        } else {
          toast.error(result.message || "Something went wrong");
        }
        return;
      }

      toast.success("Blog added successfully.");
      navigate("/");
    } catch (error) {
      console.error("Error creating blog:", error);
      toast.error(error.message || "An error occurred while creating the blog");
      console.error("Error creating blog:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mb-5">
      <div className="d-flex justify-content-between pt-5 mb-4">
        <h4>Create Blog</h4>
        <a href="/" className="btn btn-dark">
          Back
        </a>
      </div>
      <div className="card border-0 shadow-lg">
        <form onSubmit={handleSubmit(formSubmit)} encType="multipart/form-data">
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Title</label>
              <input
                {...register("title", { required: true, minLength: 10 })}
                type="text"
                className={`form-control ${errors.title && "is-invalid"}`}
                placeholder="Title"
              />
              {errors.title?.type === "required" && (
                <p className="invalid-feedback">Title field is required</p>
              )}
              {errors.title?.type === "minLength" && (
                <p className="invalid-feedback">Title must be at least 10 characters</p>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Short Description</label>
              <textarea
                {...register("shortDesc")}
                cols="30"
                rows="5"
                className="form-control"
              ></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <Editor
                value={html}
                containerProps={{ style: { height: "700px" } }}
                onChange={onChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Image</label>
              <br />
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/jpg,image/gif"
                className="form-control"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Author</label>
              <input
                {...register("author", { required: true, minLength: 3 })}
                type="text"
                className={`form-control ${errors.author && "is-invalid"}`}
                placeholder="Author"
              />
              {errors.author?.type === "required" && (
                <p className="invalid-feedback">Author field is required</p>
              )}
              {errors.author?.type === "minLength" && (
                <p className="invalid-feedback">Author must be at least 3 characters</p>
              )}
            </div>
            <button className="btn btn-dark" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBlog;
