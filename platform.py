from OpenGL.GL import *
from OpenGL.GLUT import *
from OpenGL.GLU import *
import random

# Window dimensions
W_WIDTH, W_HEIGHT = 800, 600

# Game variables
ground_y = 100  # Y-coordinate of the ground
ceiling_y = W_HEIGHT - 100  # Y-coordinate of the ceiling
block_width = 50  # Width of each block
block_height = 30  # Height of each block
block_speed = 2  # Speed of blocks moving left
blocks = []  # List of block objects

# Player variables
player_x = 100
player_y = ground_y + block_height + 10
player_width = 30
player_height = 30
player_color = (0, 1, 0)  # Green

# FPS variables
fps = 60

# Functions to create blocks
def create_block():
    # Randomly choose to place the block on the ground or the ceiling
    position = random.choice(["ground", "ceiling"])
    y = ground_y if position == "ground" else ceiling_y - block_height
    x = W_WIDTH
    block_color = (random.random(), random.random(), random.random())  # Random block color
    return {"x": x, "y": y, "width": block_width, "height": block_height, "color": block_color}

# Add initial blocks
for _ in range(5):
    blocks.append(create_block())

# Draw a rectangle
def draw_rectangle(x, y, width, height, color):
    glColor3f(*color)
    glBegin(GL_QUADS)
    glVertex2f(x, y)
    glVertex2f(x + width, y)
    glVertex2f(x + width, y + height)
    glVertex2f(x, y + height)
    glEnd()

# Draw the ground and ceiling
def draw_lines():
    glColor3f(1, 1, 1)  # White
    glBegin(GL_LINES)
    # Ground line
    glVertex2f(0, ground_y)
    glVertex2f(W_WIDTH, ground_y)
    # Ceiling line
    glVertex2f(0, ceiling_y)
    glVertex2f(W_WIDTH, ceiling_y)
    glEnd()

# Display function
def display():
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
    glLoadIdentity()

    # Draw ground and ceiling
    draw_lines()

    # Draw blocks
    for block in blocks:
        draw_rectangle(block["x"], block["y"], block["width"], block["height"], block["color"])

    # Draw player
    draw_rectangle(player_x, player_y, player_width, player_height, player_color)

    glutSwapBuffers()

# Update function for animation
def update(value):
    global blocks

    # Move blocks from right to left
    for block in blocks:
        block["x"] -= block_speed

    # Remove blocks that are off-screen
    blocks = [block for block in blocks if block["x"] + block["width"] > 0]

    # Add new blocks if needed
    if len(blocks) < 5:
        blocks.append(create_block())

    glutPostRedisplay()
    glutTimerFunc(1000 // fps, update, 0)

# Initialize OpenGL
def init():
    glClearColor(0, 0, 0, 1)  # Black background
    glMatrixMode(GL_PROJECTION)
    glLoadIdentity()
    glOrtho(0, W_WIDTH, 0, W_HEIGHT, -1, 1)

# Main function
def main():
    glutInit()
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB)
    glutInitWindowSize(W_WIDTH, W_HEIGHT)
    glutCreateWindow(b"Moving Platform Game")
    init()
    glutDisplayFunc(display)
    glutTimerFunc(0, update, 0)
    glutMainLoop()

if __name__ == "__main__":
    main()
