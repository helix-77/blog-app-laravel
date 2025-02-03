<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use App\Models\TempImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class BlogController extends Controller
{
    // This method will return all blogs
    public function index(Request $request)
    {

        $blogs = Blog::orderBy('created_at', 'DESC');

        if (!empty($request->keyword)) {
            $blogs = $blogs->where('title', 'like', '%' . $request->keyword . '%');
        }

        $blogs = $blogs->get();

        return response()->json([
            'status' => true,
            'data' => $blogs
        ]);
    }

    // This method will return a single blog
    public function show($id)
    {
        $blog = Blog::find($id);

        if ($blog == null) {
            return response()->json([
                'status' => false,
                'message' => 'Blog not found',
            ]);
        }

        $blog['date'] = \Carbon\Carbon::parse($blog->created_at)->format('d M, Y');

        return response()->json([
            'status' => true,
            'data' => $blog,
        ]);

    }

    // This method will store a blog
    public function store(Request $request)
    {
        try {
            // Debug incoming request
            Log::info('Blog store request data:', $request->all());

            $validator = Validator::make($request->all(), [
                'title' => 'required|min:10',
                'author' => 'required|min:3',
                'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
                'description' => 'nullable',
                'shortDesc' => 'nullable'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create upload directory if it doesn't exist
            $uploadPath = public_path('uploads/blogs');
            if (!File::exists($uploadPath)) {
                File::makeDirectory($uploadPath, 0777, true);
            }

            $blog = new Blog();
            $blog->title = $request->title;
            $blog->author = $request->author;
            $blog->description = $request->description;
            $blog->shortDesc = $request->shortDesc;

            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');

                // Debug image information
                Log::info('Image details:', [
                    'original_name' => $image->getClientOriginalName(),
                    'mime_type' => $image->getMimeType(),
                    'size' => $image->getSize()
                ]);

                $imageName = time() . '-' . \Str::slug($request->title) . '.' . $image->getClientOriginalExtension();
                $image->move($uploadPath, $imageName);
                $blog->image = $imageName;
            }

            $blog->save();

            return response()->json([
                'status' => true,
                'message' => 'Blog added successfully.',
                'data' => $blog
            ], 201);

        } catch (\Exception $e) {
            Log::error('Blog creation error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to create blog: ' . $e->getMessage()
            ], 500);
        }
    }

    // This method will update a blog
    public function update($id, Request $request)
    {

        $blog = Blog::find($id);

        if ($blog == null) {
            return response()->json([
                'status' => false,
                'message' => 'Blog not found.',
            ]);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|min:10',
            'author' => 'required|min:3'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Please fix the errors',
                'errors' => $validator->errors()
            ]);
        }

        $blog->title = $request->title;
        $blog->author = $request->author;
        $blog->description = $request->description;
        $blog->shortDesc = $request->shortDesc;
        $blog->save();

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if it exists
            if ($blog->image) {
                File::delete(public_path('uploads/blogs/' . $blog->image));
            }

            // Upload new image
            $image = $request->file('image');
            $imageName = time() . '-' . str_slug($request->title) . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('uploads/blogs'), $imageName);
            $blog->image = $imageName;
        }

        $blog->save();

        return response()->json([
            'status' => true,
            'message' => 'Blog updated successfully.',
            'data' => $blog
        ]);
    }

    // This method will delete a blog
    public function destroy($id)
    {

        $blog = Blog::find($id);

        if ($blog == null) {
            return response()->json([
                'status' => false,
                'message' => 'Blog not found.',
            ]);
        }

        // Delete blog image first
        File::delete(public_path('uploads/blogs/' . $blog->image));

        // Delete blog from DB
        $blog->delete();

        return response()->json([
            'status' => true,
            'message' => 'Blog deleted successfully.'
        ]);

    }

}